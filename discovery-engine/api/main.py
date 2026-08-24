from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Import routers
from .routes import health, classify, dashboard, export

# Setup Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

app = FastAPI(
    title="Discovery Engine API",
    description="API for live classification and dashboard analytics",
    version="1.0.0"
)

# CORS middleware for public access (dashboard and MVP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    Initialize connections on startup.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("WARNING: SUPABASE_URL or SUPABASE_KEY is missing. Database endpoints will fail.")
        app.state.supabase = None
    else:
        app.state.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase")

# Mount routers
app.include_router(health.router, prefix="/api", tags=["System"])
app.include_router(classify.router, prefix="/api", tags=["Classification"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(export.router, prefix="/api/export", tags=["Exports"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Discovery Engine API. See /docs for documentation."}
