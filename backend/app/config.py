import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load .env from project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env", override=True)


class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    WRITER_MODEL: str = os.getenv("WRITER_MODEL", "gpt-4o-mini")
    JUDGE_MODEL: str = os.getenv("JUDGE_MODEL", "gpt-4o-mini")

    MOCK_LLM: bool = os.getenv("MOCK_LLM", "false").lower() in ("true", "1", "yes")
    MAX_CONCURRENCY: int = int(os.getenv("MAX_CONCURRENCY", "3"))

    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000"
        ).split(",")
        if origin.strip()
    ]

    def reload(self):
        """Reloads settings from .env at runtime without server restart."""
        load_dotenv(ROOT_DIR / ".env", override=True)
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
        self.WRITER_MODEL = os.getenv("WRITER_MODEL", "gpt-4o-mini")
        self.JUDGE_MODEL = os.getenv("JUDGE_MODEL", "gpt-4o-mini")
        self.MOCK_LLM = os.getenv("MOCK_LLM", "false").lower() in ("true", "1", "yes")
        self.MAX_CONCURRENCY = int(os.getenv("MAX_CONCURRENCY", "3"))


settings = Settings()
