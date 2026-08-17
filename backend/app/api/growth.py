from fastapi import APIRouter

router = APIRouter(prefix="/growth", tags=["growth"])


@router.get("/records")
def list_growth_records() -> list[dict[str, object]]:
    return [
        {
            "date": "2026-08-11",
            "title": "第一次AI脸型分析",
            "summary": "完成正脸、45度、全身照片分析，确认当前风格方向为清冷感。",
            "tags": ["鹅蛋脸", "内双", "清冷感"],
        },
        {
            "date": "2026-08-12",
            "title": "博主A妆容学习",
            "summary": "重点学习眉毛、眼妆和腮红，但降低妆容浓度，保留个人辨识度。",
            "tags": ["眉毛", "眼妆", "腮红"],
        },
    ]
