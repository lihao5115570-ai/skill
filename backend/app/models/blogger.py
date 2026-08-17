import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


uuid_type = String(36).with_variant(UUID(as_uuid=True), "postgresql")
json_type = JSON().with_variant(JSONB, "postgresql")
tags_type = JSON().with_variant(ARRAY(Text), "postgresql")


class Blogger(Base):
    __tablename__ = "bloggers"
    __table_args__ = (
        UniqueConstraint("platform", "source_id", name="bloggers_platform_source_id_unique"),
        UniqueConstraint("platform", "source_url", name="bloggers_platform_source_url_unique"),
    )

    id: Mapped[str] = mapped_column(uuid_type, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    platform: Mapped[str] = mapped_column(String(80), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(160))
    source_url: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    style: Mapped[str | None] = mapped_column(String(80))
    face_features: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False, default=dict)
    tags: Mapped[list[str]] = mapped_column(tags_type, nullable=False, default=list)
    follower_count: Mapped[int | None] = mapped_column(Integer)
    liked_count: Mapped[int | None] = mapped_column(Integer)
    work_count: Mapped[int | None] = mapped_column(Integer)
    location: Mapped[str | None] = mapped_column(String(120))
    bio: Mapped[str | None] = mapped_column(Text)
    raw_data: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
