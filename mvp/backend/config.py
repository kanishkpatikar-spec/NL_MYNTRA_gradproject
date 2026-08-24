"""
MVP Backend — Configuration

Loads environment variables and provides app-level constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent          # mvp/
BACKEND_DIR = ROOT_DIR / "backend"
MOCK_DATA_DIR = ROOT_DIR / "mock-data"

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv(ROOT_DIR / ".env")

GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")

# ---------------------------------------------------------------------------
# App constants
# ---------------------------------------------------------------------------
APP_TITLE = "Myntra Aura Wishlist Confidence Assistant"
APP_VERSION = "0.1.0"
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_TEMPERATURE = 0.15
GROQ_MAX_TOKENS = 1024
