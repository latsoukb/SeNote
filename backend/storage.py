import json
import logging
import time
from pathlib import Path
from typing import Any, Dict

from models import TrashData, WorkspaceData

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"


def _workspace_path(workspace_id: str) -> Path:
    safe = "".join(c for c in workspace_id if c.isalnum() or c in "-_") or "local"
    return DATA_DIR / f"{safe}.json"


def default_workspace() -> WorkspaceData:
    return WorkspaceData(folders=[], notebooks=[], trash=TrashData())


def load_workspace(workspace_id: str) -> WorkspaceData:
    path = _workspace_path(workspace_id)
    if not path.exists():
        return default_workspace()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        return WorkspaceData.model_validate(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("Corrupt workspace %s: %s", workspace_id, exc)
        return default_workspace()


def save_workspace(workspace_id: str, data: WorkspaceData) -> WorkspaceData:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload: Dict[str, Any] = data.model_dump()
    payload["updated_at"] = int(time.time() * 1000)
    path = _workspace_path(workspace_id)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
    return WorkspaceData.model_validate(payload)
