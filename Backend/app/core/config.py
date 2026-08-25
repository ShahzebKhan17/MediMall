from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MediMall API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://medimall:medimall@localhost:5432/medimall"
    frontend_origin: str = "http://localhost:3000"
    secret_key: str = "change-me-before-production"
    razorpay_key_id: str = "rzp_test_placeholder"
    razorpay_key_secret: str = "placeholder_secret"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
