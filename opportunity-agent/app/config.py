from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://127.0.0.1:27017/scholara"
    mongodb_db_name: str = "scholara"
    agent_api_key: str
    admin_origins: str = "http://localhost:5173"
    fetch_interval_minutes: int = 360
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    request_timeout_seconds: int = 20

    model_config = SettingsConfigDict(
        env_file=Path.home() / ".scholara" / "agent.env",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.admin_origins.split(",") if origin.strip()]


settings = Settings()
