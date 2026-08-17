from fastapi import APIRouter

router = APIRouter(prefix="/membership", tags=["membership"])


@router.get("/plans")
def list_membership_plans() -> list[dict[str, object]]:
    return [
        {
            "id": "free",
            "name": "免费",
            "price": 0,
            "analysis_limit": 3,
            "features": ["3次分析"],
        },
        {
            "id": "monthly",
            "name": "月卡",
            "price": 2900,
            "analysis_limit": None,
            "features": ["不限次数AI分析", "博主匹配", "妆容迁移"],
        },
        {
            "id": "yearly",
            "name": "年卡",
            "price": 19900,
            "analysis_limit": None,
            "features": ["不限次数AI分析", "博主匹配", "妆容迁移", "专属成长记录"],
        }
    ]
