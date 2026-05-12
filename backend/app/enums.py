import enum


class AgeRange(str, enum.Enum):
    AGE_0_3 = "0-3"
    AGE_3_6 = "3-6"
    AGE_6_9 = "6-9"
    AGE_9_12 = "9-12"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    RESTRICTED = "restricted"
    BANNED = "banned"


class BookCategory(str, enum.Enum):
    WHITELIST = "whitelist"
    SOFT_BAN = "soft_ban"
    HARD_BAN = "hard_ban"


class BookReviewStatus(str, enum.Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    RESERVED = "reserved"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class TransactionType(str, enum.Enum):
    GIFT = "gift"
    SWAP = "swap"
    BORROW = "borrow"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"
    DISPUTED = "disputed"


class ConversationType(str, enum.Enum):
    TRANSACTIONAL = "transactional"  # gift/swap full lifecycle
    BORROW_READONLY = "borrow_readonly"  # borrow: 6-month TTL, platform doesn't manage履约


class MessageType(str, enum.Enum):
    TEXT = "text"
    AGREEMENT = "agreement"
    SYSTEM = "system"


class RiskLevel(str, enum.Enum):
    OBSERVE = "observe"
    RESTRICT = "restrict"
    BAN = "ban"


class EndorsementStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class InviteCodeStatus(str, enum.Enum):
    ACTIVE = "active"
    USED = "used"
    REVOKED = "revoked"
    EXPIRED = "expired"
