from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  ensures all tables register on Base
from .database import Base, engine
from .routers import (
    applications,
    auth,
    books,
    communities,
    conversations,
    listings,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Phase 1: create tables on startup. Switch to Alembic when schema stabilizes.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MakeFriendsViaReading",
    description="v3.2 backend skeleton — neighborhood children's-book swap/gift/borrow.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(communities.router)
app.include_router(books.router)
app.include_router(listings.router)
app.include_router(applications.router)
app.include_router(conversations.router)


@app.get("/")
def root():
    return {"name": "MakeFriendsViaReading", "version": "0.1.0", "docs": "/docs"}
