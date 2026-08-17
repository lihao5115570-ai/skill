from fastapi import APIRouter

from app.services.blogger_catalog import catalog_recommendations

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.get("/bloggers")
def recommend_bloggers() -> dict[str, object]:
    items = catalog_recommendations(limit=5)
    return {
        "title": "\u9762\u90e8\u7ed3\u6784\u76f8\u8fd1\u535a\u4e3b",
        "items": items,
    }


@router.get("/products")
def recommend_products() -> dict[str, object]:
    return {
        "title": "\u9002\u5408\u4f60\u7684\u5546\u54c1\u63a8\u8350",
        "items": [
            {
                "name": "\u4f4e\u9971\u548c\u73ab\u7470\u8272\u53e3\u7ea2",
                "category": "\u53e3\u7ea2",
                "reason": "\u9002\u5408\u504f\u767d\u80a4\u8272\u548c\u6e05\u51b7\u611f\u98ce\u683c\u3002",
                "price": 12900,
            },
            {
                "name": "\u81ea\u7136\u7070\u68d5\u7709\u7b14",
                "category": "\u7709\u6bdb",
                "reason": "\u5f31\u5316\u7709\u8272\u6d53\u5ea6\uff0c\u4fdd\u7559\u5e72\u51c0\u8f6e\u5ed3\u3002",
                "price": 5900,
            },
            {
                "name": "\u4f4e\u95ea\u7ec6\u817b\u9ad8\u5149",
                "category": "\u9ad8\u5149",
                "reason": "\u589e\u5f3a\u8f6e\u5ed3\u611f\uff0c\u4e0d\u7834\u574f\u6e05\u900f\u5986\u611f\u3002",
                "price": 8900,
            },
        ],
    }
