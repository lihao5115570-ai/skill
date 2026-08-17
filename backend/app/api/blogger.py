from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.blogger import Blogger
from app.services.blogger_catalog import load_blogger_catalog
from app.services.blogger_import import upsert_bloggers

router = APIRouter(prefix="/bloggers", tags=["bloggers"])


@router.get("")
def list_bloggers(limit: int = 50, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        bloggers = db.scalars(select(Blogger).order_by(Blogger.updated_at.desc()).limit(limit)).all()
        return [serialize_blogger(blogger) for blogger in bloggers]
    except SQLAlchemyError:
        return load_blogger_catalog(limit=limit)


@router.post("/import")
def import_bloggers(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, int]:
    records = payload.get("records") or payload.get("data") or []
    if not isinstance(records, list):
        records = [records]

    platform = str(payload.get("platform") or "douyin")
    imported = upsert_bloggers(db, [record for record in records if isinstance(record, dict)], platform=platform)
    return {"imported": imported}


def serialize_blogger(blogger: Blogger) -> dict[str, Any]:
    return {
        "id": str(blogger.id),
        "name": blogger.name,
        "platform": blogger.platform,
        "source_id": blogger.source_id,
        "source_url": blogger.source_url,
        "avatar_url": blogger.avatar_url,
        "style": blogger.style,
        "face_features": blogger.face_features,
        "tags": blogger.tags,
        "follower_count": blogger.follower_count,
        "liked_count": blogger.liked_count,
        "work_count": blogger.work_count,
        "location": blogger.location,
        "bio": blogger.bio,
        "raw_data": blogger.raw_data,
        "created_at": blogger.created_at.isoformat() if blogger.created_at else None,
        "updated_at": blogger.updated_at.isoformat() if blogger.updated_at else None,
    }
