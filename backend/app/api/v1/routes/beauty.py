from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.beauty import BeautyAnalysisResult
from app.services.vision import VisionImage, analyze_beauty_images

router = APIRouter(prefix="/beauty")

MAX_IMAGE_SIZE = 10 * 1024 * 1024


async def _read_image(file: UploadFile, label: str) -> VisionImage:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"{label} must be an image")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"{label} is empty")
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"{label} exceeds 10MB")

    return VisionImage(label=label, content_type=file.content_type, data=data)


@router.post("/analyze", response_model=BeautyAnalysisResult)
async def analyze_beauty(
    front_face: UploadFile = File(...),
    angle_45: UploadFile = File(...),
    full_body: UploadFile = File(...),
) -> BeautyAnalysisResult:
    images = [
        await _read_image(front_face, "\u6b63\u8138"),
        await _read_image(angle_45, "45\u5ea6"),
        await _read_image(full_body, "\u5168\u8eab"),
    ]
    return await analyze_beauty_images(images)
