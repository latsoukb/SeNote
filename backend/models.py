from typing import Any, Optional

from pydantic import BaseModel, Field


class TrashData(BaseModel):
    notebooks: list[Any] = Field(default_factory=list)
    pages: list[Any] = Field(default_factory=list)


class WorkspaceData(BaseModel):
    folders: list[Any] = Field(default_factory=list)
    notebooks: list[Any] = Field(default_factory=list)
    trash: TrashData = Field(default_factory=TrashData)
    updated_at: Optional[int] = None


class HealthResponse(BaseModel):
    status: str
    storage: str
