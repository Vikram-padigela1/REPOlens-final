from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ask, ingest

load_dotenv()  # Load variables from .env

app = FastAPI(title="RepoLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(ask.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
