from fastapi import APIRouter
from pydantic import BaseModel

from app.services.blogger_catalog import catalog_recommendations
from app.services.face_rules import build_report

router = APIRouter(prefix="/beauty", tags=["beauty"])

TEST_COUNT = 13826


class BeautyAnalyzeRequest(BaseModel):
    front_image_url: str | None = None
    angle_image_url: str | None = None
    body_image_url: str | None = None


def demo_metrics() -> dict[str, float]:
    return {
        "face_length_width_ratio": 1.179,
        "jaw_cheekbone_width_ratio": 0.757,
        "upper_face_cheekbone_ratio": 1.017,
        "lower_face_ratio": 0.396,
        "eye_spacing_face_width_ratio": 0.245,
        "eye_aspect_ratio": 3.109,
        "nose_width_ratio": 0.231,
        "lip_width_ratio": 0.327,
        "brow_lip_ratio": 0.431,
    }


def build_analysis_response(metrics: dict[str, float], payload: BeautyAnalyzeRequest | None = None) -> dict[str, object]:
    report = build_report(metrics)
    response: dict[str, object] = {
        "face_shape": report["face_shape"],
        "eye_shape": "\u5185\u53cc",
        "skin_color": "\u504f\u767d",
        "style_type": "\u6e05\u51b7\u611f",
        "advantage": report["advantage"],
        "improvement": report["improvement"],
        "quality": {
            "passed": True,
            "message": "\u7167\u7247\u8d28\u91cf\u901a\u8fc7\uff0c\u5df2\u5f00\u59cb\u5339\u914d\u76f8\u4f3c\u535a\u4e3b\u3002",
        },
        "metrics": metrics,
        "recommendations": catalog_recommendations(3, metrics),
    }
    if payload is not None:
        response["source_images"] = {
            "front": payload.front_image_url,
            "angle": payload.angle_image_url,
            "body": payload.body_image_url,
        }
    return response


@router.post("/analyze")
def analyze_beauty(payload: BeautyAnalyzeRequest) -> dict[str, object]:
    return build_analysis_response(demo_metrics(), payload)


@router.post("/test-count/next")
def next_test_count() -> dict[str, int]:
    global TEST_COUNT
    TEST_COUNT += 1
    return {"count": TEST_COUNT}


@router.get("/report")
def get_beauty_report() -> dict[str, object]:
    return build_analysis_response(demo_metrics())


@router.post("/makeup-transfer")
def transfer_makeup() -> dict[str, object]:
    return {
        "your_version": "\u4e0d\u8981\u5b8c\u5168\u590d\u5236",
        "adjustments": {
            "\u7709\u6bdb": "\u964d\u4f4e10%",
            "\u773c\u5f71": "\u51cf\u5c1130%",
            "\u53e3\u7ea2": "\u9009\u62e9\u5e72\u67af\u73ab\u7470\u8272\u53f7",
        },
    }
