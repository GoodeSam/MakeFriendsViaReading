from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from .. import schemas
from ..database import get_db
from ..deps import get_current_user
from ..enums import BookCategory, ListingStatus, TransactionType
from ..mocks import is_high_value_title, lookup_book_by_isbn
from ..models import Book, Listing, User

router = APIRouter(prefix="/api/listings", tags=["listings"])


def _get_or_create_book(db: Session, isbn: str) -> Book:
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if book:
        return book
    meta = lookup_book_by_isbn(isbn)
    if not meta:
        raise HTTPException(status_code=400, detail="unknown ISBN")
    book = Book(
        isbn=meta["isbn"],
        title=meta["title"],
        author=meta.get("author"),
        publisher=meta.get("publisher"),
        cover_url=meta.get("cover_url"),
        category=BookCategory.WHITELIST,
        is_high_value=is_high_value_title(meta["title"], meta.get("publisher")),
    )
    db.add(book)
    db.flush()
    return book


@router.post("", response_model=schemas.ListingOut)
def create_listing(
    req: schemas.ListingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not (req.can_gift or req.can_swap or req.can_borrow):
        raise HTTPException(
            status_code=400,
            detail="must select at least one of gift / swap / borrow",
        )

    book = _get_or_create_book(db, req.isbn)
    if book.category == BookCategory.HARD_BAN:
        raise HTTPException(status_code=400, detail="book category not allowed")

    # v3.2 §4.4.2: 高价值套书系统层面禁借
    can_borrow = req.can_borrow and not book.is_high_value

    listing = Listing(
        owner_id=user.id,
        community_id=user.community_id,
        book_id=book.id,
        condition_note=req.condition_note,
        can_gift=req.can_gift,
        can_swap=req.can_swap,
        can_borrow=can_borrow,
        borrow_terms=req.borrow_terms if can_borrow else None,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    listing = (
        db.query(Listing)
        .options(selectinload(Listing.book), selectinload(Listing.owner))
        .filter(Listing.id == listing.id)
        .first()
    )
    return listing


@router.get("", response_model=list[schemas.ListingOut])
def list_my_community(
    type: TransactionType | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Browse active listings in the current user's community."""
    q = (
        db.query(Listing)
        .options(selectinload(Listing.book), selectinload(Listing.owner))
        .filter(
            Listing.community_id == user.community_id,
            Listing.status == ListingStatus.ACTIVE,
        )
    )
    if type == TransactionType.GIFT:
        q = q.filter(Listing.can_gift.is_(True))
    elif type == TransactionType.SWAP:
        q = q.filter(Listing.can_swap.is_(True))
    elif type == TransactionType.BORROW:
        q = q.filter(Listing.can_borrow.is_(True))
    return q.order_by(Listing.created_at.desc()).all()


@router.get("/mine", response_model=list[schemas.ListingOut])
def list_my_listings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Listing)
        .options(selectinload(Listing.book), selectinload(Listing.owner))
        .filter(Listing.owner_id == user.id)
        .order_by(Listing.created_at.desc())
        .all()
    )


@router.get("/{listing_id}", response_model=schemas.ListingOut)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    listing = (
        db.query(Listing)
        .options(selectinload(Listing.book), selectinload(Listing.owner))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing or listing.community_id != user.community_id:
        raise HTTPException(status_code=404, detail="listing not found")
    return listing
