from __future__ import annotations

import json
from typing import Any

from backend.services.data_service import load_users
from backend.utils.helpers import clean_user_record, format_user_to_text


def _load_rag_model() -> Any:
    try:
        from backend import model as rag_model

        return rag_model
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "RAG model initialization failed. Ensure required model dependencies and env vars are configured."
        ) from exc


def _parse_match_output(raw_output: Any) -> tuple[list[dict[str, Any]], Any]:
    if isinstance(raw_output, dict):
        matches = raw_output.get("matches", [])
        if isinstance(matches, list):
            return [m for m in matches if isinstance(m, dict)][:3], raw_output
        return [], raw_output

    if isinstance(raw_output, list):
        return [m for m in raw_output if isinstance(m, dict)][:3], raw_output

    if isinstance(raw_output, str):
        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError:
            return [], raw_output

        if isinstance(parsed, dict) and isinstance(parsed.get("matches"), list):
            return [m for m in parsed["matches"] if isinstance(m, dict)][:3], parsed

        return [], parsed

    return [], raw_output


def users_to_documents(users: list[dict[str, Any]]) -> list[str]:
    return [format_user_to_text(user) for user in users]


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


def resolve_current_user(wallet: str | None = None, name: str | None = None) -> dict[str, Any]:
    users = load_users()
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


def run_match(new_user: dict[str, Any]) -> tuple[list[dict[str, Any]], Any]:
    rag_model = _load_rag_model()

    users = load_users()
    if not users:
        raise ValueError("No cached users available. Call /refresh-users first.")

    cleaned_new_user = clean_user_record(new_user)
    candidate_users = [clean_user_record(user) for user in users]
    candidate_users = [user for user in candidate_users if not _same_identity(user, cleaned_new_user)]
    if not candidate_users:
        raise ValueError("No other users available to match against.")

    documents = users_to_documents(candidate_users)

    if hasattr(rag_model, "match_users") and callable(rag_model.match_users):
        raw_result = rag_model.match_users(cleaned_new_user, documents)
        return _parse_match_output(raw_result)

    # Keep integration simple by using existing model.py functions.
    vectorstore = rag_model.build_vectorstore(candidate_users)
    if not vectorstore:
        raise ValueError("Could not build vector store from users.json")

    candidates = rag_model.retrieve_candidates(cleaned_new_user, vectorstore, k=3)
    raw_result = rag_model.find_best_match(cleaned_new_user, candidates)
    return _parse_match_output(raw_result)
