from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import get_current_user
from ..enums import ConversationType, MessageType
from ..mocks import moderate_text
from ..models import Application, Conversation, Listing, Message, User

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def _ensure_participant(db: Session, conv: Conversation, user: User) -> None:
    app = db.get(Application, conv.application_id)
    listing = db.get(Listing, app.listing_id)
    if user.id not in (listing.owner_id, app.applicant_id):
        raise HTTPException(status_code=403, detail="not a participant")


@router.get("/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="conversation not found")
    _ensure_participant(db, conv, user)
    return (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/{conversation_id}/messages", response_model=schemas.MessageOut)
def post_message(
    conversation_id: int,
    req: schemas.MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="conversation not found")
    _ensure_participant(db, conv, user)

    # Borrow conversations are read-only after a short scheduling window
    # (v3.2 §4.4.3 — "永久只读站内会话, 平台不催促"). Phase 1: 7-day window for
    # logistics, then read-only.
    if conv.type == ConversationType.BORROW_READONLY:
        age_days = (datetime.now(timezone.utc) - conv.created_at).days
        if age_days > 7:
            raise HTTPException(status_code=400, detail="borrow conversation is read-only")

    passed, reason = moderate_text(req.content)
    if not passed:
        raise HTTPException(status_code=400, detail=f"content rejected: {reason}")

    msg = Message(
        conversation_id=conv.id,
        sender_id=user.id,
        type=MessageType.TEXT,
        content=req.content,
        moderation_passed=True,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
