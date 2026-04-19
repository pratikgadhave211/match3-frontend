from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from backend.config import DATA_DIR, DATA_FILE_PATH
from backend.models.schemas import RefreshUsersResponse, UserResponse
from backend.utils.helpers import clean_user_record
from backend.web3_fetch_users import fetch_blockchain_users_structured

router = APIRouter(tags=["users"])


def _load_users() -> list[dict[str, object]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE_PATH.exists():
        DATA_FILE_PATH.write_text("[]\n", encoding="utf-8")

    try:
        parsed = json.loads(DATA_FILE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []

    if not isinstance(parsed, list):
        return []

    return [item for item in parsed if isinstance(item, dict)]


def _save_users(users: list[dict[str, object]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = [item for item in users if isinstance(item, dict)]
    DATA_FILE_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


@router.get("/users", response_model=list[UserResponse])
def get_users() -> list[UserResponse]:
    users = _load_users()
    return [UserResponse(**user) for user in users]


@router.post("/refresh-users", response_model=RefreshUsersResponse)
def refresh_users() -> RefreshUsersResponse:
    try:
        users = fetch_blockchain_users_structured()
        cleaned_users = [clean_user_record(user) for user in users]
        _save_users(cleaned_users)
        return RefreshUsersResponse(
            success=True,
            message="Blockchain users fetched and cached in users.json",
            count=len(cleaned_users),
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Refresh failed: {exc}") from exc
