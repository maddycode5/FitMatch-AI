import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Locate .env file in backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class Settings(BaseSettings):
    # Primary Gnani Credentials
    GNANI_ACCESS_KEY: str = ""
    GNANI_TOKEN: str = ""

    # Secondary Fallback Credentials
    GNANI_FALLBACK_ACCESS_KEY: str = ""
    GNANI_FALLBACK_TOKEN: str = ""

    # Backup Credentials
    GNANI_BACKUP_ACCESS_KEY: str = ""
    GNANI_BACKUP_TOKEN: str = ""

    # Voice & Language Configuration
    GNANI_VOICE_CLONE_ID: str = "Vikrant"
    GNANI_VOICE: str = "Vikrant"
    GNANI_MODEL: str = "timbre-v2.5"
    GNANI_LANG: str = "en-IN"

    # API Endpoints (Official Gnani Vachana Platform)
    GNANI_TTS_ENDPOINT: str = "https://api.vachana.ai/api/v1/tts/inference"
    GNANI_STT_ENDPOINT: str = "https://api.vachana.ai/stt/v3"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"

settings = Settings()
