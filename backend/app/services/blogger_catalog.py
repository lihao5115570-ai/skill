from __future__ import annotations

import json
from pathlib import Path
from typing import Any


CATALOG_CANDIDATES = [
    Path("storage/kaogujia_teaching_makeup_non_sellers.json"),
    Path("../storage/kaogujia_teaching_makeup_non_sellers.json"),
    Path("storage/kaogujia_teaching_makeup_bloggers.json"),
    Path("../storage/kaogujia_teaching_makeup_bloggers.json"),
    Path("storage/kaogujia_female_authors_priority.json"),
    Path("../storage/kaogujia_female_authors_priority.json"),
    Path("storage/kaogujia_female_authors_multi_sort.json"),
    Path("../storage/kaogujia_female_authors_multi_sort.json"),
]

METRIC_STANDARDS = {
    "face_length_width_ratio": (1.13, 1.24),
    "jaw_cheekbone_width_ratio": (0.74, 0.84),
    "upper_face_cheekbone_ratio": (0.96, 1.04),
    "lower_face_ratio": (0.36, 0.40),
    "eye_spacing_face_width_ratio": (0.23, 0.27),
    "eye_aspect_ratio": (2.85, 3.25),
    "nose_width_ratio": (0.21, 0.25),
    "lip_width_ratio": (0.30, 0.34),
    "brow_lip_ratio": (0.34, 0.40),
}

PROFILE_TEMPLATES = [
    {
        "label": "淡颜鹅蛋脸",
        "target": {"face_length_width_ratio": 1.18, "jaw_cheekbone_width_ratio": 0.76, "upper_face_cheekbone_ratio": 1.02, "lower_face_ratio": 0.39, "eye_spacing_face_width_ratio": 0.245, "eye_aspect_ratio": 3.08, "nose_width_ratio": 0.23, "lip_width_ratio": 0.33, "brow_lip_ratio": 0.39},
        "learn": ["淡颜轮廓", "低饱和眼妆", "干净底妆"],
    },
    {
        "label": "短圆亲和脸",
        "target": {"face_length_width_ratio": 1.05, "jaw_cheekbone_width_ratio": 0.86, "upper_face_cheekbone_ratio": 0.98, "lower_face_ratio": 0.38, "eye_spacing_face_width_ratio": 0.215, "eye_aspect_ratio": 2.72, "nose_width_ratio": 0.23, "lip_width_ratio": 0.31, "brow_lip_ratio": 0.35},
        "learn": ["自然眉形", "清透底妆", "唇腮同色"],
    },
    {
        "label": "方圆上镜脸",
        "target": {"face_length_width_ratio": 1.16, "jaw_cheekbone_width_ratio": 0.88, "upper_face_cheekbone_ratio": 0.97, "lower_face_ratio": 0.36, "eye_spacing_face_width_ratio": 0.26, "eye_aspect_ratio": 3.12, "nose_width_ratio": 0.25, "lip_width_ratio": 0.32, "brow_lip_ratio": 0.43},
        "learn": ["眼尾延展", "卧蚕亮点", "柔和修容"],
    },
    {
        "label": "菱形明艳脸",
        "target": {"face_length_width_ratio": 1.20, "jaw_cheekbone_width_ratio": 0.71, "upper_face_cheekbone_ratio": 1.0, "lower_face_ratio": 0.35, "eye_spacing_face_width_ratio": 0.23, "eye_aspect_ratio": 2.92, "nose_width_ratio": 0.23, "lip_width_ratio": 0.34, "brow_lip_ratio": 0.37},
        "learn": ["眉尾延长", "唇色提亮", "颧骨弱化"],
    },
    {
        "label": "长形成熟脸",
        "target": {"face_length_width_ratio": 1.34, "jaw_cheekbone_width_ratio": 0.78, "upper_face_cheekbone_ratio": 1.02, "lower_face_ratio": 0.37, "eye_spacing_face_width_ratio": 0.25, "eye_aspect_ratio": 2.86, "nose_width_ratio": 0.24, "lip_width_ratio": 0.30, "brow_lip_ratio": 0.36},
        "learn": ["纵向脸修饰", "面中提亮", "轮廓收窄"],
    },
]


def load_blogger_catalog(limit: int = 80) -> list[dict[str, Any]]:
    for path in CATALOG_CANDIDATES:
        if path.exists():
            try:
                rows = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            return [normalize_catalog_row(row, index) for index, row in enumerate(rows[:limit])]
    return fallback_bloggers()[:limit]


def normalize_catalog_row(row: dict[str, Any], index: int = 0) -> dict[str, Any]:
    display_id = row.get("display_id") or row.get("UniqueId") or row.get("ShortId") or row.get("uid") or row.get("Uid")
    avatar = row.get("avatar") or row.get("Avatar") or row.get("avatar_url")
    raw_profile = row.get("face_metrics") or row.get("profile_metrics")
    template = PROFILE_TEMPLATES[index % len(PROFILE_TEMPLATES)]
    return {
        "id": str(row.get("uid") or row.get("Uid") or row.get("id") or row.get("Id") or display_id or ""),
        "name": row.get("nick_name") or row.get("NickName") or row.get("name") or "未知达人",
        "platform": "douyin",
        "source_id": display_id,
        "source_url": row.get("source_url") or (f"https://www.douyin.com/search/{display_id}" if display_id else None),
        "avatar_url": avatar,
        "style": row.get("style") or template["label"],
        "tags": ["女性达人", "美妆参考", template["label"]],
        "follower_count": row.get("fans") or row.get("Platform_Fans"),
        "work_count": sum_ints(row.get("videos"), row.get("lives"), row.get("Awemes")),
        "target_metrics": raw_profile or template["target"],
        "learn": template["learn"],
        "raw_data": row,
    }


def catalog_recommendations(limit: int = 5, metrics: dict[str, float] | None = None) -> list[dict[str, Any]]:
    rows = load_blogger_catalog(max(40, limit))
    scored_rows = sorted(
        (build_recommendation_item(row, metrics) for row in rows),
        key=lambda item: item["match"],
        reverse=True,
    )
    return scored_rows[:limit]


def build_recommendation_item(row: dict[str, Any], metrics: dict[str, float] | None) -> dict[str, Any]:
    target = row.get("target_metrics") or {}
    match = score_metrics(metrics, target) if metrics else 92
    reasons = explain_metric_match(metrics, target) if metrics else ["面部结构模板接近", "适合参考妆容表达", "风格方向相近"]
    return {
        "name": row["name"],
        "match": match,
        "avatar_url": row.get("avatar_url"),
        "source_id": row.get("source_id"),
        "source_url": row.get("source_url"),
        "style": row.get("style"),
        "reasons": reasons,
        "learn": row.get("learn") or ["眉毛", "眼妆", "腮红"],
    }


def score_metrics(metrics: dict[str, float] | None, target: dict[str, float]) -> int:
    if not metrics or not target:
        return 82
    weights = {
        "face_length_width_ratio": 1.25,
        "jaw_cheekbone_width_ratio": 1.35,
        "upper_face_cheekbone_ratio": 0.9,
        "lower_face_ratio": 1.15,
        "eye_spacing_face_width_ratio": 1.2,
        "eye_aspect_ratio": 1.1,
        "nose_width_ratio": 0.75,
        "lip_width_ratio": 0.75,
        "brow_lip_ratio": 0.8,
    }
    distance = 0.0
    for key, weight in weights.items():
        if key not in metrics or key not in target:
            continue
        low, high = METRIC_STANDARDS[key]
        scale = max(high - low, 0.04)
        distance += abs(float(metrics[key]) - float(target[key])) / scale * weight
    return max(72, min(96, round(98 - distance * 2.25)))


def explain_metric_match(metrics: dict[str, float] | None, target: dict[str, float]) -> list[str]:
    if not metrics or not target:
        return ["面部结构模板接近", "适合参考妆容表达", "风格方向相近"]
    candidates = [
        ("脸型长宽比接近，整体轮廓走向更相似。", abs(metrics["face_length_width_ratio"] - target["face_length_width_ratio"])),
        ("下颌与颧骨宽度比例接近，适合参考修容边界。", abs(metrics["jaw_cheekbone_width_ratio"] - target["jaw_cheekbone_width_ratio"])),
        ("眼距和眼型比例接近，眼妆放大方式可参考。", abs(metrics["eye_spacing_face_width_ratio"] - target["eye_spacing_face_width_ratio"]) + abs(metrics["eye_aspect_ratio"] - target["eye_aspect_ratio"]) / 10),
        ("唇宽与眉唇比例接近，适合学习唇腮同色处理。", abs(metrics["lip_width_ratio"] - target["lip_width_ratio"]) + abs(metrics["brow_lip_ratio"] - target["brow_lip_ratio"])),
    ]
    return [item[0] for item in sorted(candidates, key=lambda item: item[1])[:3]]


def sum_ints(*values: Any) -> int | None:
    total = 0
    seen = False
    for value in values:
        try:
            total += int(value)
            seen = True
        except (TypeError, ValueError):
            continue
    return total if seen else None


def fallback_bloggers() -> list[dict[str, Any]]:
    return [
        {
            "id": "demo-1",
            "name": "大娜娜 Nana",
            "platform": "douyin",
            "source_id": "Sunny99nana",
            "source_url": "https://www.douyin.com/search/Sunny99nana",
            "style": "淡颜鹅蛋脸",
            "tags": ["女性达人", "美妆参考"],
            "follower_count": None,
            "work_count": None,
            "avatar_url": "https://pic.kaogujia.com/author/62739255052.jpeg?auth_key=1786678183-0-0-4fb09623b63459822dee2a23a3de0193",
            "target_metrics": PROFILE_TEMPLATES[0]["target"],
            "learn": PROFILE_TEMPLATES[0]["learn"],
            "raw_data": {},
        }
    ]
