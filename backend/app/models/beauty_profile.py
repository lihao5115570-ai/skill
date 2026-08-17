from pydantic import BaseModel


class BeautyProfile(BaseModel):
    user_id: str
    face_shape: str
    eye_shape: str
    skin: str
    style: str
