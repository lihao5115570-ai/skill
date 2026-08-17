from pydantic import BaseModel


class BeautyAnalysisResult(BaseModel):
    face_shape: str
    eye_shape: str
    skin: str
    style: str

