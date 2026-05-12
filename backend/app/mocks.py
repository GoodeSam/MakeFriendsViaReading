"""Phase-1 mocks for SMS, ISBN metadata lookup, and content moderation.

These keep development free of paid third-party accounts. Replace with real
腾讯云短信 / 内容安全 / 豆瓣 / ISBNDB integrations before going live.
"""

from .config import settings


def send_sms_code(phone: str) -> str:
    """Pretend to send an SMS verification code; just print it to stdout."""
    print(f"[MOCK SMS] -> {phone}: code is {settings.MOCK_SMS_CODE}")
    return settings.MOCK_SMS_CODE


def verify_sms_code(phone: str, code: str) -> bool:
    return code == settings.MOCK_SMS_CODE


# Hard-coded "high-value series" used to flag is_high_value when looking up ISBNs.
_HIGH_VALUE_SERIES_KEYWORDS = (
    "牛津",
    "Oxford Reading Tree",
    "海尼曼",
    "Heinemann",
    "RAZ",
    "培生",
    "Pearson",
    "I Can Read",
)


def lookup_book_by_isbn(isbn: str) -> dict | None:
    """Pretend to call a book-metadata API. Returns a stub record."""
    return {
        "isbn": isbn,
        "title": f"Mock Book ({isbn})",
        "author": "Mock Author",
        "publisher": "Mock Publisher",
        "cover_url": None,
        "is_high_value": False,
        "series_name": None,
    }


def is_high_value_title(title: str, publisher: str | None = None) -> bool:
    text = f"{title} {publisher or ''}"
    return any(kw.lower() in text.lower() for kw in _HIGH_VALUE_SERIES_KEYWORDS)


_DENY_KEYWORDS = ("微信号", "wechat", "支付宝", "二维码", "vx：", "vx:")


def moderate_text(content: str) -> tuple[bool, str | None]:
    """Returns (passed, reason). Phase 1: simple keyword denylist."""
    lowered = content.lower()
    for kw in _DENY_KEYWORDS:
        if kw.lower() in lowered:
            return False, f"包含禁词: {kw}"
    return True, None
