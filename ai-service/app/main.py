from fastapi import FastAPI
from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    image_url: str
    user_id: str | None = None


app = FastAPI(title="AI Beauty Analysis Service")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/analyze")
def analyze(payload: AnalysisRequest) -> dict[str, object]:
    return {
        "image_url": payload.image_url,
        "user_id": payload.user_id,
        "skin_tone": "neutral",
        "face_shape": "oval",
        "confidence": 0.72,
        "recommendations": [
            "Use a lightweight base with soft-focus finish.",
            "Try warm rose lip color for a natural daily look."
        ],
    }
