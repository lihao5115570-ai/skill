from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.admin import AdminProfile, AdminRolePermission, BloggerApplication, BloggerApplicationAuditLog

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminLookupRequest(BaseModel):
    email: str
    auth_user_id: str | None = None


class BloggerApplicationCreate(BaseModel):
    reference_type: str = "female_makeup"
    platform: str
    creator_name: str
    contact_email: str
    homepage_url: str
    tutorial_url: str | None = None
    photo_url: str | None = None
    selected_content_direction: list[str] = []
    authorization_confirmed: bool = False


class BloggerApplicationReview(BaseModel):
    admin_email: str
    status: str
    note: str | None = None


@router.post("/me")
def get_admin_profile(payload: AdminLookupRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    admin = db.scalar(select(AdminProfile).where(AdminProfile.email == payload.email.lower(), AdminProfile.is_active.is_(True)))
    if not admin:
        raise HTTPException(status_code=403, detail="This account is not an active admin.")

    permissions = db.scalars(
        select(AdminRolePermission.permission_code).where(AdminRolePermission.role == admin.role)
    ).all()
    return {
        "id": str(admin.id),
        "email": admin.email,
        "display_name": admin.display_name,
        "role": admin.role,
        "permissions": list(permissions),
    }


@router.post("/blogger-applications")
def create_blogger_application(payload: BloggerApplicationCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    application = BloggerApplication(
        reference_type=payload.reference_type,
        platform=payload.platform,
        creator_name=payload.creator_name,
        contact_email=str(payload.contact_email).lower(),
        homepage_url=payload.homepage_url,
        tutorial_url=payload.tutorial_url,
        photo_url=payload.photo_url,
        selected_content_direction=payload.selected_content_direction,
        authorization_confirmed=payload.authorization_confirmed,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return {"id": str(application.id), "status": application.status}


@router.get("/blogger-applications")
def list_blogger_applications(status: str = "pending", db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(BloggerApplication).where(BloggerApplication.status == status).order_by(BloggerApplication.created_at.desc())
    ).all()
    return [serialize_application(row) for row in rows]


@router.post("/blogger-applications/{application_id}/review")
def review_blogger_application(application_id: str, payload: BloggerApplicationReview, db: Session = Depends(get_db)) -> dict[str, Any]:
    if payload.status not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="status must be approved or rejected")

    admin = db.scalar(select(AdminProfile).where(AdminProfile.email == payload.admin_email.lower(), AdminProfile.is_active.is_(True)))
    if not admin:
        raise HTTPException(status_code=403, detail="Admin account is not active.")

    can_review = db.scalar(
        select(AdminRolePermission).where(
            AdminRolePermission.role == admin.role,
            AdminRolePermission.permission_code == f"blogger_review.{ 'approve' if payload.status == 'approved' else 'reject' }",
        )
    )
    if not can_review:
        raise HTTPException(status_code=403, detail="Missing blogger review permission.")

    application = db.get(BloggerApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = payload.status
    application.review_note = payload.note
    application.reviewed_by = admin.id
    application.reviewed_at = datetime.now(timezone.utc)
    db.add(BloggerApplicationAuditLog(application_id=application.id, admin_id=admin.id, action=payload.status, note=payload.note))
    db.commit()
    db.refresh(application)
    return serialize_application(application)


def serialize_application(row: BloggerApplication) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "reference_type": row.reference_type,
        "platform": row.platform,
        "creator_name": row.creator_name,
        "contact_email": row.contact_email,
        "homepage_url": row.homepage_url,
        "tutorial_url": row.tutorial_url,
        "photo_url": row.photo_url,
        "selected_content_direction": row.selected_content_direction,
        "authorization_confirmed": row.authorization_confirmed,
        "status": row.status,
        "review_note": row.review_note,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "reviewed_at": row.reviewed_at.isoformat() if row.reviewed_at else None,
    }
