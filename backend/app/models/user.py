from pydantic import BaseModel


class User(BaseModel):
    id: str
    phone: str
    age: int | None = None
    city: str | None = None
    registered_at: str | None = None
    membership_level: str = "free"
