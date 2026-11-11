from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, SessionLocal, engine
from .routers import bookings, listings, users
from .routers.listings import UPLOAD_DIR
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_if_empty(db)  # a fresh deploy is usable immediately
    yield


app = FastAPI(title="Roost API", lifespan=lifespan)

# ponytail: open CORS is fine while auth is a mock header (no cookies).
# With real auth, list the frontend origin here.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

for router in (listings.router, bookings.router, users.router):
    app.include_router(router, prefix="/api")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
