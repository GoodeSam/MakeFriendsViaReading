"""Seed demo data. Run from the backend/ directory: `python -m app.seed`"""
from .database import Base, SessionLocal, engine
from .enums import AgeRange, BookCategory, InviteCodeStatus, ListingStatus
from .models import Book, Child, Community, InviteCode, Listing, User


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Community).count() > 0:
            print("seed data already present, skipping")
            return

        c1 = Community(name="阳光花园", city="深圳", district="南山区")
        c2 = Community(name="星河湾", city="深圳", district="福田区")
        db.add_all([c1, c2])
        db.flush()

        invites = [
            InviteCode(code="WELCOME001", community_id=c1.id, status=InviteCodeStatus.ACTIVE),
            InviteCode(code="WELCOME002", community_id=c1.id, status=InviteCodeStatus.ACTIVE),
            InviteCode(code="WELCOME003", community_id=c2.id, status=InviteCodeStatus.ACTIVE),
        ]
        db.add_all(invites)

        # Demo users (can login with phone + code 123456)
        u1 = User(phone="13800000001", nickname="小明妈妈", community_id=c1.id)
        u2 = User(phone="13800000002", nickname="小红爸爸", community_id=c1.id)
        db.add_all([u1, u2])
        db.flush()

        db.add(Child(parent_id=u1.id, age_range=AgeRange.AGE_3_6))
        db.add(Child(parent_id=u2.id, age_range=AgeRange.AGE_6_9))
        db.flush()

        books = [
            Book(isbn="9787544291293", title="猜猜我有多爱你", author="山姆·麦克布雷尼",
                 publisher="南海出版公司", category=BookCategory.WHITELIST),
            Book(isbn="9787539190488", title="活了100万次的猫", author="佐野洋子",
                 publisher="二十一世纪出版社", category=BookCategory.WHITELIST),
            Book(isbn="9787530746301", title="好饿的毛毛虫", author="埃瑞克·卡尔",
                 publisher="明天出版社", category=BookCategory.WHITELIST),
            Book(isbn="9787545203301", title="彩虹鱼", author="马库斯·菲斯特",
                 publisher="河北教育出版社", category=BookCategory.WHITELIST),
            Book(isbn="9787532244904", title="大卫不可以", author="大卫·香农",
                 publisher="上海科学技术出版社", category=BookCategory.WHITELIST),
            Book(
                isbn="9787221176134", title="牛津阅读树 Stage 1", author="Roderick Hunt",
                publisher="Oxford University Press", category=BookCategory.WHITELIST,
                is_high_value=True, series_name="Oxford Reading Tree",
            ),
        ]
        db.add_all(books)
        db.flush()

        b = {b.isbn: b for b in books}
        listings = [
            Listing(owner_id=u1.id, community_id=c1.id, book_id=b["9787544291293"].id,
                    can_gift=True, condition_note="八成新，孩子非常喜欢"),
            Listing(owner_id=u1.id, community_id=c1.id, book_id=b["9787530746301"].id,
                    can_swap=True, condition_note="有几处涂鸦，内容完整"),
            Listing(owner_id=u1.id, community_id=c1.id, book_id=b["9787532244904"].id,
                    can_gift=True, can_swap=True, condition_note="全新未读"),
            Listing(owner_id=u2.id, community_id=c1.id, book_id=b["9787539190488"].id,
                    can_gift=True, condition_note="九成新"),
            Listing(owner_id=u2.id, community_id=c1.id, book_id=b["9787545203301"].id,
                    can_swap=True, can_borrow=True,
                    borrow_terms="借期2周，请保持书况"),
        ]
        db.add_all(listings)
        db.commit()

        print("✅ seed data created:")
        print(f"  - communities: {c1.name} (id={c1.id}), {c2.name} (id={c2.id})")
        print("  - invite codes: WELCOME001 (社区1), WELCOME002 (社区1), WELCOME003 (社区2)")
        print("  - demo users: 13800000001 (小明妈妈), 13800000002 (小红爸爸) — code: 123456")
        print(f"  - books: {[b.title for b in books]}")
        print(f"  - listings: {len(listings)} listings in 阳光花园")
    finally:
        db.close()


if __name__ == "__main__":
    main()
