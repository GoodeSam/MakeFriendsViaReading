from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .enums import (
    AgeRange,
    ApplicationStatus,
    BookCategory,
    ConversationType,
    ListingStatus,
    ListingType,
    MessageType,
    TransactionType,
    UserStatus,
)


# ---- Auth ----

class SendCodeRequest(BaseModel):
    phone: str = Field(min_length=11, max_length=11)


class RegisterRequest(BaseModel):
    phone: str = Field(min_length=11, max_length=11)
    code: str
    nickname: str = Field(min_length=1, max_length=40)
    invite_code: str | None = None
    community_id: int
    children_age_ranges: list[AgeRange] = Field(default_factory=list)


class LoginRequest(BaseModel):
    phone: str = Field(min_length=11, max_length=11)
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int


# ---- Community ----

class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    city: str
    district: str


# ---- User ----

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nickname: str
    community_id: int
    status: UserStatus
    is_endorsed: bool


# ---- Book ----

class BookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    isbn: str
    title: str
    author: str | None
    publisher: str | None
    cover_url: str | None
    category: BookCategory
    is_high_value: bool
    circulation_count: int


# ---- Listing ----

class OwnerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nickname: str
    is_endorsed: bool


class ListingCreate(BaseModel):
    isbn: str
    listing_type: ListingType = ListingType.OFFER
    condition_note: str | None = None
    can_gift: bool = False
    can_swap: bool = False
    can_borrow: bool = False
    can_sell: bool = False
    sell_price: int | None = None
    borrow_terms: str | None = None


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    owner: OwnerBrief
    community_id: int
    community: CommunityOut
    book: BookOut
    listing_type: ListingType
    condition_note: str | None
    can_gift: bool
    can_swap: bool
    can_borrow: bool
    can_sell: bool
    sell_price: int | None
    borrow_terms: str | None
    status: ListingStatus
    created_at: datetime


# ---- Application ----

class ApplicationCreate(BaseModel):
    listing_id: int
    type: TransactionType
    message: str | None = None
    swap_offered_listing_id: int | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing_id: int
    applicant_id: int
    type: TransactionType
    status: ApplicationStatus
    message: str | None
    created_at: datetime


class ApplicationDetail(BaseModel):
    id: int
    type: TransactionType
    status: ApplicationStatus
    message: str | None
    created_at: datetime
    listing_id: int
    book_title: str
    book_cover_url: str | None
    applicant_id: int
    applicant_nickname: str
    owner_id: int
    owner_nickname: str
    conversation_id: int | None


# ---- Conversation / Message ----

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    sender_id: int | None
    type: MessageType
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    application_id: int
    type: ConversationType
    archived_at: datetime | None
    expires_at: datetime | None
