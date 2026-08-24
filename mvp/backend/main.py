"""
Myntra Aura Wishlist Confidence Assistant — MVP Backend

FastAPI app serving the wishlist data, AI module engine, and event logging.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import APP_TITLE, APP_VERSION
from backend.routes import health, wishlist, modules, events
from backend.services import catalog_service

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — load all data into memory on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading mock data into memory...")
    products = catalog_service.get_all_products()
    corpus_size = catalog_service.get_corpus_size()
    logger.info("  Products loaded: %d", len(products))
    logger.info("  Review corpus loaded: %d snippets", corpus_size)
    logger.info("MVP Backend ready!")
    yield
    logger.info("Shutting down MVP Backend.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS — allow all origins for development / public demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(wishlist.router)
app.include_router(modules.router)
app.include_router(events.router)


@app.get("/")
def root():
    return {
        "app": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
    }
