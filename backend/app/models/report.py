from pydantic import BaseModel


class BeautyReport(BaseModel):
    user_id: str
    report: dict[str, object]
    created_time: str | None = None
