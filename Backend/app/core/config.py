from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MediMall API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://medimall:medimall@localhost:5432/medimall"
    frontend_origin: str = "http://localhost:3000,https://medi-mall-three.vercel.app"
    secret_key: str = "change-me-before-production"
    razorpay_key_id: str = "rzp_test_placeholder"
    razorpay_key_secret: str = "placeholder_secret"
    resend_api_key: str = ""
    resend_from_email: str = "MediMall <onboarding@resend.dev>"
    frontend_url: str = "http://localhost:3000"


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")

    @property
    def parsed_frontend_origins(self) -> List[str]:
        origins = set()
        for item in self.frontend_origin.split(","):
            cleaned = item.strip().rstrip("/")
            if cleaned:
                origins.add(cleaned)
        # Always allow standard local dev origins as fallbacks
        origins.update([
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://medi-mall-three.vercel.app",
        ])
        return list(origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()

