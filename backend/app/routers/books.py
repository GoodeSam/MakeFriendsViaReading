from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..enums import BookCategory
from ..mocks import is_high_value_title, lookup_book_by_isbn
from ..models import Book

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("/by-isbn/{isbn}", response_model=schemas.BookOut)
def get_or_create_by_isbn(isbn: str, db: Session = Depends(get_db)):
    """Look up a book by ISBN; if not in DB, fetch metadata via mock and create."""
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if book:
        return book
    meta = lookup_book_by_isbn(isbn)
    if not meta:
        raise HTTPException(status_code=404, detail="ISBN metadata not found")
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
    db.commit()
    db.refresh(book)
    return book
