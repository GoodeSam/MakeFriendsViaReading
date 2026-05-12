from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Community

router = APIRouter(prefix="/api/communities", tags=["communities"])


@router.get("", response_model=list[schemas.CommunityOut])
def list_communities(db: Session = Depends(get_db)):
    return db.query(Community).order_by(Community.id).all()
