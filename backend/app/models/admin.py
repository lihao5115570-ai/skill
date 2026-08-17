import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


uuid_type = String(36).with_variant(UUID(as_uuid=True), "postgresql")
json_type = JSON().with_variant(JSONB, "postgresql")
tags_type = JSON().with_variant(ARRAY(Text), "postgresql")


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    id: Mapped[str] = mapped_column(uuid_type, primary_key=True, default=lambda: str(uuid.uuid4()))
    auth_user_id: Mapped[str | None] = mapped_column(uuid_type, unique=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(40), nullable=False, default="reviewer")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdminPermission(Base):
    __tablename__ = "admin_permissions"

    id: Mapped[str] = mapped_column(uuid_type, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AdminRolePermission(Base):
    __tablename__ = "admin_role_permissions"
    __table_args__ = (UniqueConstraint("role", "permission_code", name="admin_role_permission_unique"),)

    role: Mapped[str] = mapped_column(String(40), primary_key=True)
    permission_code: Mapped[str] = mapped_column(ForeignKey("admin_permissions.code", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BloggerApplication(Base):
    __tablename__ = "blogger_applications"

    id: Mapped[str] = mapped_column(uuid_type, primary_key=True, default=lambda: str(uuid.uuid4()))
    applicant_user_id: Mapped[str | None] = mapped_column(uuid_type)
    reference_type: Mapped[str] = mapped_column(String(60), nullable=False, default="female_makeup")
    platform: Mapped[str] = mapped_column(String(60), nullable=False)
    creator_name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(160), nullable=False)
    homepage_url: Mapped[str] = mapped_column(Text, nullable=False)
    tutorial_url: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(Text)
    extracted_face_features: Mapped[dict] = mapped_column(json_type, nullable=False, default=dict)
    selected_content_direction: Mapped[list[str]] = mapped_column(tags_type, nullable=False, default=list)
    authorization_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="pending")
    review_note: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[str | None] = mapped_column(ForeignKey("admin_profiles.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BloggerApplicationAuditLog(Base):
    __tablename__ = "blogger_application_audit_logs"

    id: Mapped[str] = mapped_column(uuid_type, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id: Mapped[str] = mapped_column(ForeignKey("blogger_applications.id", ondelete="CASCADE"), nullable=False)
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("admin_profiles.id"))
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
