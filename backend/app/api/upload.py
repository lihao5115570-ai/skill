from fastapi import APIRouter, UploadFile, File
from uuid import uuid4

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/image")
async def upload_image(file: UploadFile = File(...)) -> dict[str, object]:
    image_id = str(uuid4())
    return {
        "image_id": image_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "url": f"/storage/uploads/{file.filename}",
        "analyze_url": "/api/beauty/analyze",
    }
