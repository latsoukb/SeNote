import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware

from models import HealthResponse, WorkspaceData
from storage import load_workspace, save_workspace

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="SeNote API", version="1.0.0")
api = APIRouter(prefix="/api")

CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")


def workspace_id_header(x_workspace_id: Optional[str] = Header(default=None)) -> str:
    return (x_workspace_id or "local").strip() or "local"


@api.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", storage="json")


@api.get("/workspace", response_model=WorkspaceData)
async def get_workspace(x_workspace_id: Optional[str] = Header(default=None)):
    wid = workspace_id_header(x_workspace_id)
    data = load_workspace(wid)
    logger.info("Loaded workspace %s (%d notebooks)", wid, len(data.notebooks))
    return data


@api.put("/workspace", response_model=WorkspaceData)
async def put_workspace(
    body: WorkspaceData,
    x_workspace_id: Optional[str] = Header(default=None),
):
    wid = workspace_id_header(x_workspace_id)
    saved = save_workspace(wid, body)
    logger.info(
        "Saved workspace %s (%d notebooks, %d folders)",
        wid,
        len(saved.notebooks),
        len(saved.folders),
    )
    return saved


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)
