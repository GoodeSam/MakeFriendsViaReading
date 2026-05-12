from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import create_access_token
from ..database import get_db
from ..deps import get_current_user
from ..enums import InviteCodeStatus
from ..mocks import send_sms_code, verify_sms_code
from ..models import Child, Community, InviteCode, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-code")
def send_code(req: schemas.SendCodeRequest):
    send_sms_code(req.phone)
    return {"sent": True}


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if not verify_sms_code(req.phone, req.code):
        raise HTTPException(status_code=400, detail="invalid SMS code")

    if db.query(User).filter(User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="phone already registered")

    community = db.get(Community, req.community_id)
    if not community:
        raise HTTPException(status_code=400, detail="community not found")

    invite: InviteCode | None = None
    if req.invite_code:
        invite = (
            db.query(InviteCode)
            .filter(
                InviteCode.code == req.invite_code,
                InviteCode.status == InviteCodeStatus.ACTIVE,
                InviteCode.community_id == req.community_id,
            )
            .first()
        )
        if not invite:
            raise HTTPException(status_code=400, detail="invalid invite code")
    # In dev we allow registration without invite code so seeding the first user
    # is painless. Production should require invite_code or pending endorsements.

    user = User(
        phone=req.phone,
        nickname=req.nickname,
        community_id=req.community_id,
    )
    db.add(user)
    db.flush()

    if invite:
        invite.status = InviteCodeStatus.USED
        invite.used_by_user_id = user.id

    for age_range in req.children_age_ranges:
        db.add(Child(parent_id=user.id, age_range=age_range))

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user_id=user.id)


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    if not verify_sms_code(req.phone, req.code):
        raise HTTPException(status_code=400, detail="invalid SMS code")
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user_id=user.id)


@router.get("/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    return user
