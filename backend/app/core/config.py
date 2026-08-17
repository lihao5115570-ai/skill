from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Beauty Growth API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://beauty_app:beauty_app_password@localhost:5432/beauty_growth"
    cors_origins: list[str] = ["http://localhost:3000"]
    upload_dir: str = "uploads"
    openai_api_key: str = ""
    openai_vision_model: str = "gpt-5"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
