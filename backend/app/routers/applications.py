from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import get_current_user
from ..enums import (
    ApplicationStatus,
    ConversationType,
    ListingStatus,
    TransactionType,
)
from ..models import Application, Book, Conversation, Listing, User

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[schemas.ApplicationDetail])
def list_applications(
    role: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if role == "sent":
        apps = db.query(Application).filter(Application.applicant_id == user.id)
    elif role == "received":
        apps = (
            db.query(Application)
            .join(Listing, Application.listing_id == Listing.id)
            .filter(Listing.owner_id == user.id)
        )
    else:
        apps = (
            db.query(Application)
            .join(Listing, Application.listing_id == Listing.id)
            .filter(or_(Application.applicant_id == user.id, Listing.owner_id == user.id))
        )
    apps = apps.order_by(Application.created_at.desc()).all()

    result = []
    for app in apps:
        listing = db.get(Listing, app.listing_id)
        book = db.get(Book, listing.book_id)
        applicant = db.get(User, app.applicant_id)
        owner = db.get(User, listing.owner_id)
        conv = db.query(Conversation).filter(Conversation.application_id == app.id).first()
        result.append(schemas.ApplicationDetail(
            id=app.id,
            type=app.type,
            status=app.status,
            message=app.message,
            created_at=app.created_at,
            listing_id=listing.id,
            book_title=book.title,
            book_cover_url=book.cover_url,
            applicant_id=applicant.id,
            applicant_nickname=applicant.nickname,
            owner_id=owner.id,
            owner_nickname=owner.nickname,
            conversation_id=conv.id if conv else None,
        ))
    return result


@router.post("", response_model=schemas.ApplicationOut)
def create_application(
    req: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    listing = db.get(Listing, req.listing_id)
    if not listing or listing.community_id != user.community_id:
        raise HTTPException(status_code=404, detail="listing not found")
    if listing.owner_id == user.id:
        raise HTTPException(status_code=400, detail="cannot apply to your own listing")
    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="listing not active")

    if req.type == TransactionType.GIFT and not listing.can_gift:
        raise HTTPException(status_code=400, detail="listing not available for gift")
    if req.type == TransactionType.SWAP and not listing.can_swap:
        raise HTTPException(status_code=400, detail="listing not available for swap")
    if req.type == TransactionType.BORROW:
        if not listing.can_borrow:
            raise HTTPException(status_code=400, detail="listing not available for borrow")
        # v3.2 §11.2 — borrow access gated on at least one completed gift/swap.
        completed = (
            db.query(Application)
            .filter(
                Application.applicant_id == user.id,
                Application.status == ApplicationStatus.COMPLETED,
                Application.type.in_([TransactionType.GIFT, TransactionType.SWAP]),
            )
            .count()
        )
        if completed < 1:
            raise HTTPException(
                status_code=403,
                detail="borrow access requires ≥1 completed gift or swap",
            )

    if req.type == TransactionType.SWAP:
        if not req.swap_offered_listing_id:
            raise HTTPException(status_code=400, detail="swap requires an offered listing")
        offered = db.get(Listing, req.swap_offered_listing_id)
        if not offered or offered.owner_id != user.id:
            raise HTTPException(status_code=400, detail="invalid offered listing")

    app = Application(
        listing_id=listing.id,
        applicant_id=user.id,
        type=req.type,
        message=req.message,
        swap_offered_listing_id=req.swap_offered_listing_id,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def _load_app_or_404(db: Session, application_id: int) -> Application:
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="application not found")
    return app


@router.post("/{application_id}/accept", response_model=schemas.ApplicationOut)
def accept_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app = _load_app_or_404(db, application_id)
    listing = db.get(Listing, app.listing_id)
    if listing.owner_id != user.id:
        raise HTTPException(status_code=403, detail="not the listing owner")
    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="application not pending")

    app.status = ApplicationStatus.ACCEPTED
    app.accepted_at = datetime.now(timezone.utc)
    listing.status = ListingStatus.RESERVED

    # Borrow conversations carry a 6-month TTL per v3.2 §4.4.3 ("永久只读").
    if app.type == TransactionType.BORROW:
        conv = Conversation(
            application_id=app.id,
            type=ConversationType.BORROW_READONLY,
            expires_at=datetime.now(timezone.utc) + timedelta(days=180),
        )
    else:
        conv = Conversation(application_id=app.id, type=ConversationType.TRANSACTIONAL)
    db.add(conv)

    db.commit()
    db.refresh(app)
    return app


@router.post("/{application_id}/reject", response_model=schemas.ApplicationOut)
def reject_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app = _load_app_or_404(db, application_id)
    listing = db.get(Listing, app.listing_id)
    if listing.owner_id != user.id:
        raise HTTPException(status_code=403, detail="not the listing owner")
    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="application not pending")
    app.status = ApplicationStatus.REJECTED
    db.commit()
    db.refresh(app)
    return app


@router.post("/{application_id}/complete", response_model=schemas.ApplicationOut)
def complete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Phase-1 simplification: either party clicking 'completed' closes the loop.
    Two-sided confirmation + 4-photo evidence comes in phase 2 (v3.2 §4.3)."""
    app = _load_app_or_404(db, application_id)
    listing = db.get(Listing, app.listing_id)
    if user.id not in (listing.owner_id, app.applicant_id):
        raise HTTPException(status_code=403, detail="not a participant")
    if app.status not in (ApplicationStatus.ACCEPTED, ApplicationStatus.IN_PROGRESS):
        raise HTTPException(status_code=400, detail="application not in progress")
    app.status = ApplicationStatus.COMPLETED
    app.completed_at = datetime.now(timezone.utc)
    listing.status = ListingStatus.COMPLETED
    book = db.get(Book, listing.book_id)
    if book:
        book.circulation_count += 1
    db.commit()
    db.refresh(app)
    return app
