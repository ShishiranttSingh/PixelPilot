from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    PROJECT_NAME: str = "PixelPilot"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = Field(default="insecure-change-me-at-all-costs-for-production")
    ALLOWED_HOSTS: List[str] = ["http://localhost:3000",]
    INITIAL_CREDITS: int = 250


class AuthSettings(BaseSettings):
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_NAME: str = "pixelpilot_refresh_token"
    SECURE_COOKIE: bool = False  # Set to True in production


class DatabaseSettings(BaseSettings):
    URL: str = Field(alias="DATABASE_URL")
    POOL_SIZE: int = 20
    MAX_OVERFLOW: int = 10


class RedisSettings(BaseSettings):
    URL: str = Field(alias="REDIS_URL")


class CloudinarySettings(BaseSettings):
    CLOUD_NAME: Optional[str] = Field(default=None, alias="CLOUDINARY_CLOUD_NAME")
    API_KEY: Optional[str] = Field(default=None, alias="CLOUDINARY_API_KEY")
    API_SECRET: Optional[str] = Field(default=None, alias="CLOUDINARY_API_SECRET")


class AISettings(BaseSettings):
    MODELS_DIR: str = "/app/ai/models"
    USE_GPU: bool = True
    ONNX_EXECUTION_PROVIDER: str = "CUDAExecutionProvider"  # Fallback to CPU handled in code
    MAX_IMAGE_DIMENSION: int = 8192
    MAX_FILE_SIZE_MB: int = 50
    TILING_SIZE: int = 1024
    TILING_OVERLAP: int = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",
        case_sensitive=True,
        extra="ignore"
    )

    app: AppSettings = AppSettings()
    auth: AuthSettings = AuthSettings()
    db: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    cloudinary: CloudinarySettings = CloudinarySettings()
    ai: AISettings = AISettings()


settings = Settings()