import base64
import json
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.schemas.beauty import BeautyAnalysisResult


@dataclass(frozen=True)
class VisionImage:
    label: str
    content_type: str
    data: bytes


DEFAULT_ANALYSIS = BeautyAnalysisResult(
    face_shape="\u9e45\u86cb\u8138",
    eye_shape="\u5185\u53cc",
    skin="\u504f\u767d",
    style="\u6e05\u51b7\u611f",
)


def _to_data_url(image: VisionImage) -> str:
    encoded = base64.b64encode(image.data).decode("ascii")
    return f"data:{image.content_type};base64,{encoded}"


def _extract_output_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]

    output = payload.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]

    return ""


async def analyze_beauty_images(images: list[VisionImage]) -> BeautyAnalysisResult:
    if not settings.openai_api_key:
        return DEFAULT_ANALYSIS

    content = [
        {
            "type": "input_text",
            "text": (
                "\u4f60\u662f\u4e00\u540d\u5ba1\u614e\u7684\u7f8e\u5986\u98ce\u683c\u5206\u6790\u52a9\u624b\u3002"
                "\u6839\u636e\u7528\u6237\u4e0a\u4f20\u7684\u6b63\u8138\u300145\u5ea6\u3001\u5168\u8eab\u7167\u7247\uff0c"
                "\u5206\u6790\u8138\u578b\u3001\u773c\u578b\u3001\u80a4\u8272\u503e\u5411\u548c\u6574\u4f53\u98ce\u683c\u3002"
                "\u53ea\u8f93\u51fa JSON\uff0c\u5b57\u6bb5\u5fc5\u987b\u662f face_shape\u3001eye_shape\u3001skin\u3001style\uff0c"
                "\u503c\u4f7f\u7528\u7b80\u77ed\u4e2d\u6587\u3002"
            ),
        }
    ]

    for image in images:
        content.append({"type": "input_text", "text": f"\u7167\u7247\u7c7b\u578b\uff1a{image.label}"})
        content.append({"type": "input_image", "image_url": _to_data_url(image), "detail": "auto"})

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_vision_model,
                "input": [{"role": "user", "content": content}],
            },
        )
        response.raise_for_status()

    output_text = _extract_output_text(response.json())
    try:
        return BeautyAnalysisResult.model_validate(json.loads(output_text))
    except (json.JSONDecodeError, ValueError):
        return DEFAULT_ANALYSIS

