from fastapi import UploadFile


class ImageService:
    async def save_upload(self, file: UploadFile) -> str:
        return f"/storage/uploads/{file.filename}"
