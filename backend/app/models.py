from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .enums import (
    AgeRange,
    BookCategory,
    BookReviewStatus,
    ConversationType,
    EndorsementStatus,
    InviteCodeStatus,
    ListingStatus,
    MessageType,
    ApplicationStatus,
    RiskLevel,
    TransactionType,
    UserStatus,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(60))
    district: Mapped[str] = mapped_column(String(60))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="community")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(40))
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    status: Mapped[UserStatus] = mapped_column(SAEnum(UserStatus), default=UserStatus.ACTIVE)
    is_endorsed: Mapped[bool] = mapped_column(Boolean, default=False)
    can_borrow_in: Mapped[bool] = mapped_column(Boolean, default=True)
    can_borrow_out: Mapped[bool] = mapped_column(Boolean, default=True)
    restricted_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    community: Mapped["Community"] = relationship(back_populates="users")
    children: Mapped[list["Child"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    listings: Mapped[list["Listing"]] = relationship(back_populates="owner")


class Child(Base):
    __tablename__ = "children"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    age_range: Mapped[AgeRange] = mapped_column(SAEnum(AgeRange))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    parent: Mapped["User"] = relationship(back_populates="children")


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    isbn: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    author: Mapped[str | None] = mapped_column(String(120), nullable=True)
    publisher: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[BookCategory] = mapped_column(SAEnum(BookCategory), default=BookCategory.WHITELIST)
    review_status: Mapped[BookReviewStatus] = mapped_column(
        SAEnum(BookReviewStatus), default=BookReviewStatus.APPROVED
    )
    # 高价值套书系统层面禁借 (v3.2 §4.4.2)
    is_high_value: Mapped[bool] = mapped_column(Boolean, default=False)
    series_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"), index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    condition_note: Mapped[str | None] = mapped_column(String(120), nullable=True)
    can_gift: Mapped[bool] = mapped_column(Boolean, default=False)
    can_swap: Mapped[bool] = mapped_column(Boolean, default=False)
    can_borrow: Mapped[bool] = mapped_column(Boolean, default=False)
    borrow_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ListingStatus] = mapped_column(SAEnum(ListingStatus), default=ListingStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    owner: Mapped["User"] = relationship(back_populates="listings")
    book: Mapped["Book"] = relationship()


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"))
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType))
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus), default=ApplicationStatus.PENDING
    )
    message: Mapped[str | None] = mapped_column(String(200), nullable=True)
    swap_offered_listing_id: Mapped[int | None] = mapped_column(
        ForeignKey("listings.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    listing: Mapped["Listing"] = relationship(foreign_keys=[listing_id])


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), unique=True)
    type: Mapped[ConversationType] = mapped_column(SAEnum(ConversationType))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    type: Mapped[MessageType] = mapped_column(SAEnum(MessageType), default=MessageType.TEXT)
    content: Mapped[str] = mapped_column(Text)
    moderation_passed: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class Agreement(Base):
    __tablename__ = "agreements"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), unique=True)
    content: Mapped[str] = mapped_column(Text)
    lender_agreed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    borrower_agreed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel))
    reason_code: Mapped[str] = mapped_column(String(60))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    issued_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    used_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[InviteCodeStatus] = mapped_column(
        SAEnum(InviteCodeStatus), default=InviteCodeStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Endorsement(Base):
    __tablename__ = "endorsements"

    id: Mapped[int] = mapped_column(primary_key=True)
    endorser_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    endorsee_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    status: Mapped[EndorsementStatus] = mapped_column(
        SAEnum(EndorsementStatus), default=EndorsementStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("endorser_id", "endorsee_id", name="uq_endorsement_pair"),
    )
