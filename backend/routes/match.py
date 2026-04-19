from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.config import DATA_DIR, DATA_FILE_PATH
from backend.models.schemas import MatchCurrentUserRequest, MatchItem, MatchResponse, MatchUserRequest, UserResponse
from backend.utils.helpers import clean_user_record

router = APIRouter(tags=["match"])


def _load_rag_model() -> Any:
    from backend import model as rag_model

    return rag_model


def _load_users() -> list[dict[str, Any]]:
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


def _parse_match_output(raw_output: Any) -> tuple[list[dict[str, Any]], Any]:
    if isinstance(raw_output, dict):
        matches = raw_output.get("matches", [])
        if isinstance(matches, list):
            return [item for item in matches if isinstance(item, dict)][:3], raw_output
        return [], raw_output

    if isinstance(raw_output, list):
        return [item for item in raw_output if isinstance(item, dict)][:3], raw_output

    if isinstance(raw_output, str):
        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError:
            return [], raw_output

        if isinstance(parsed, dict) and isinstance(parsed.get("matches"), list):
            return [item for item in parsed["matches"] if isinstance(item, dict)][:3], parsed

        return [], parsed

    return [], raw_output


def _same_identity(left: dict[str, Any], right: dict[str, Any]) -> bool:
    left_clean = clean_user_record(left)
    right_clean = clean_user_record(right)

    left_wallet = str(left_clean.get("wallet") or "").strip().lower()
    right_wallet = str(right_clean.get("wallet") or "").strip().lower()
    if left_wallet and right_wallet and left_wallet == right_wallet:
        return True

    left_name = str(left_clean.get("name") or "").strip().lower()
    right_name = str(right_clean.get("name") or "").strip().lower()
    if left_name and right_name and left_name == right_name:
        return True

    return False


def _resolve_current_user(wallet: str | None = None, name: str | None = None) -> dict[str, Any]:
    users = _load_users()
    if not users:
        raise ValueError("No cached users available. Call /refresh-users first.")

    normalized_wallet = (wallet or "").strip().lower()
    normalized_name = (name or "").strip().lower()

    if normalized_wallet:
        for user in users:
            user_wallet = str(user.get("wallet") or "").strip().lower()
            if user_wallet == normalized_wallet:
                return clean_user_record(user)

    if normalized_name:
        for user in users:
            user_name = str(user.get("name") or "").strip().lower()
            if user_name == normalized_name:
                return clean_user_record(user)

    if len(users) == 1:
        return clean_user_record(users[0])

    raise ValueError("Current user not found in cached users. Refresh users and try again.")


def _run_match(new_user: dict[str, Any]) -> tuple[list[dict[str, Any]], Any]:
    users = _load_users()
    if not users:
        raise ValueError("No cached users available. Call /refresh-users first.")

    cleaned_new_user = clean_user_record(new_user)
    candidate_users = [clean_user_record(user) for user in users]
    candidate_users = [user for user in candidate_users if not _same_identity(user, cleaned_new_user)]
    if not candidate_users:
        raise ValueError("No other users available to match against.")

    rag_model = _load_rag_model()
    vectorstore = rag_model.build_vectorstore(candidate_users)
    if not vectorstore:
        raise ValueError("Could not build vector store from users.json")

    candidates = rag_model.retrieve_candidates(cleaned_new_user, vectorstore, k=3)
    raw_result = rag_model.find_best_match(cleaned_new_user, candidates)
    matches, parsed = _parse_match_output(raw_result)

    if not matches:
        raise ValueError("RAG returned empty or invalid match output.")

    return matches, parsed


@router.post("/match-user", response_model=MatchResponse)
def match_user(payload: MatchUserRequest) -> MatchResponse:
    new_user = clean_user_record(
        {
            "name": payload.name,
            "interests": payload.interests,
            "goals": payload.goals,
        }
    )

    try:
        matches, raw = _run_match(new_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Matching failed: {exc}") from exc

    return MatchResponse(
        matches=[MatchItem(**item) for item in matches],
        current_user=UserResponse(**new_user),
        raw=raw,
    )


@router.post("/match-current-user", response_model=MatchResponse)
def match_current_user(payload: MatchCurrentUserRequest) -> MatchResponse:
    try:
        current_user = _resolve_current_user(wallet=payload.wallet, name=payload.name)
        matches, raw = _run_match(current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Matching failed: {exc}") from exc

    return MatchResponse(
        matches=[MatchItem(**item) for item in matches],
        current_user=UserResponse(**current_user),
        raw=raw,
    )
