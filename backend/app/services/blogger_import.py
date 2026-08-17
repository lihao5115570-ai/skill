from __future__ import annotations

import re
from typing import Any

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.models.blogger import Blogger


FIELD_ALIASES = {
    "name": ["name", "nickname", "nick_name", "nickName", "NickName", "authorName", "达人昵称", "昵称", "博主昵称", "达人名称"],
    "source_id": ["source_id", "display_id", "UniqueId", "ShortId", "douyinId", "userId", "uid", "Uid", "secUid", "sec_uid", "抖音号", "达人ID", "用户ID"],
    "source_url": ["source_url", "homeUrl", "homepage", "profileUrl", "Url", "url", "主页链接", "达人主页"],
    "avatar_url": ["avatar_url", "avatar", "Avatar", "avatarUrl", "headImg", "头像", "头像链接"],
    "style": ["style", "category", "BloggerTagName1", "垂类", "赛道", "风格"],
    "follower_count": ["follower_count", "fans", "fansCount", "followerCount", "Platform_Fans", "粉丝数", "粉丝"],
    "liked_count": ["liked_count", "likedCount", "likeCount", "LikeCount", "获赞数", "点赞数"],
    "work_count": ["work_count", "awemeCount", "videoCount", "Awemes", "作品数"],
    "location": ["location", "Location", "City", "Province", "City2", "Province2", "地区", "城市"],
    "bio": ["bio", "signature", "Signature", "desc", "简介", "达人简介"],
    "tags": ["tags", "Tags", "tagList", "labels", "ContentTags", "TopCates", "标签"],
}


def normalize_blogger_record(record: dict[str, Any], platform: str = "douyin") -> dict[str, Any]:
    normalized: dict[str, Any] = {
        "platform": platform,
        "face_features": {},
        "tags": [],
        "source_id": None,
        "source_url": None,
        "avatar_url": None,
        "style": None,
        "follower_count": None,
        "liked_count": None,
        "work_count": None,
        "location": None,
        "bio": None,
        "raw_data": record,
    }

    for target, aliases in FIELD_ALIASES.items():
        value = first_present(record, aliases)
        if value is None:
            continue
        if target.endswith("_count"):
            normalized[target] = parse_count(value)
        elif target == "tags":
            normalized[target] = parse_tags(value)
        else:
            normalized[target] = clean_text(value)

    raw_data = record.get("raw_data") if isinstance(record.get("raw_data"), dict) else {}
    avatar_from_raw = raw_data.get("avatar") or raw_data.get("avatar_url") or raw_data.get("Avatar")
    if not normalized.get("avatar_url") and avatar_from_raw:
        normalized["avatar_url"] = clean_text(avatar_from_raw)

    if not normalized.get("source_url") and normalized.get("source_id"):
        normalized["source_url"] = f"https://www.douyin.com/search/{normalized['source_id']}"

    if not normalized.get("name"):
        normalized["name"] = normalized.get("source_id") or normalized.get("source_url") or "未知达人"

    if not normalized.get("style"):
        normalized["style"] = "化妆教学"

    return normalized


def upsert_bloggers(db: Session, records: list[dict[str, Any]], platform: str = "douyin") -> int:
    rows = [normalize_blogger_record(record, platform=platform) for record in records]
    if not rows:
        return 0

    id_rows = dedupe_rows([row for row in rows if row.get("source_id")], ["platform", "source_id"])
    url_rows = dedupe_rows([row for row in rows if not row.get("source_id") and row.get("source_url")], ["platform", "source_url"])
    new_rows = [row for row in rows if not row.get("source_id") and not row.get("source_url")]

    for batch, conflict_cols in ((id_rows, ["platform", "source_id"]), (url_rows, ["platform", "source_url"])):
        if batch:
            execute_upsert(db, batch, conflict_cols)

    if new_rows:
        db.add_all(Blogger(**row) for row in new_rows)

    db.commit()
    return len(rows)


def execute_upsert(db: Session, rows: list[dict[str, Any]], conflict_cols: list[str]) -> None:
    dialect = db.get_bind().dialect.name
    insert_fn = pg_insert if dialect == "postgresql" else sqlite_insert if dialect == "sqlite" else None
    if insert_fn is None:
        db.add_all(Blogger(**row) for row in rows)
        return

    stmt = insert_fn(Blogger).values(rows)
    update_cols = {
        col.name: getattr(stmt.excluded, col.name)
        for col in Blogger.__table__.columns
        if col.name not in {"id", "created_at"}
    }
    db.execute(stmt.on_conflict_do_update(index_elements=conflict_cols, set_=update_cols))


def first_present(record: dict[str, Any], aliases: list[str]) -> Any:
    for alias in aliases:
        if alias in record and record[alias] not in (None, ""):
            return record[alias]
    return None


def dedupe_rows(rows: list[dict[str, Any]], key_fields: list[str]) -> list[dict[str, Any]]:
    keyed: dict[tuple[Any, ...], dict[str, Any]] = {}
    for row in rows:
        keyed[tuple(row.get(field) for field in key_fields)] = row
    return list(keyed.values())


def clean_text(value: Any) -> str:
    return str(value).strip()


def parse_tags(value: Any) -> list[str]:
    if isinstance(value, list):
        return [clean_text(item) for item in value if clean_text(item)]
    return [part.strip() for part in re.split(r"[,，、\s]+", clean_text(value)) if part.strip()]


def parse_count(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)

    text = clean_text(value).replace(",", "")
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None

    number = float(match.group(1))
    if "亿" in text:
        number *= 100_000_000
    elif "万" in text or "w" in text.lower():
        number *= 10_000
    elif "k" in text.lower():
        number *= 1_000

    return int(number)
