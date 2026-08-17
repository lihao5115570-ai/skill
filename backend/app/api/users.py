from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


class UserRegisterRequest(BaseModel):
    phone: str
    age: int | None = None
    city: str | None = None


@router.post("/register")
def register_user(payload: UserRegisterRequest) -> dict[str, object]:
    return {
        "id": "demo-user",
        "phone": payload.phone,
        "age": payload.age,
        "city": payload.city,
        "membership_level": "free",
        "analysis_limit": 3,
    }


@router.get("/me")
def get_current_user() -> dict[str, object]:
    return {
        "id": "demo-user",
        "phone": "13800000000",
        "age": 28,
        "city": "上海",
        "membership_level": "free",
        "analysis_limit": 3,
    }
