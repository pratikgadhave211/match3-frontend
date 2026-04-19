from __future__ import annotations

import json
import os
from typing import Any

from backend.services.data_service import load_users
from backend.utils.helpers import clean_user_record, format_user_to_text


def _load_rag_model() -> Any:
    try:
        from backend import model as rag_model

        return rag_model
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            f"RAG model initialization failed: {exc.__class__.__name__}: {exc}"
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


def _norm_set(values: list[str]) -> set[str]:
    return {str(value).strip().lower() for value in values if str(value).strip()}


def _build_reason(current_user: dict[str, Any], candidate_user: dict[str, Any]) -> str:
    current_interests = _norm_set(current_user.get("interests", []))
    candidate_interests = _norm_set(candidate_user.get("interests", []))
    current_goals = _norm_set(current_user.get("goals", []))
    candidate_goals = _norm_set(candidate_user.get("goals", []))

    shared_interests = sorted(current_interests & candidate_interests)
    shared_goals = sorted(current_goals & candidate_goals)

    if shared_interests and shared_goals:
        return (
            f"Shared interests ({', '.join(shared_interests[:2])}) and aligned goals "
            f"({', '.join(shared_goals[:2])}) suggest a strong networking fit."
        )

    if shared_interests:
        return f"Common interests ({', '.join(shared_interests[:3])}) make this connection relevant for collaboration."

    if shared_goals:
        return f"Similar goals ({', '.join(shared_goals[:3])}) indicate practical value from connecting at this event."

    return "Profile signals are moderately related based on overall interests/goals overlap."


def _heuristic_score(current_user: dict[str, Any], candidate_user: dict[str, Any]) -> int:
    current_interests = _norm_set(current_user.get("interests", []))
    candidate_interests = _norm_set(candidate_user.get("interests", []))
    current_goals = _norm_set(current_user.get("goals", []))
    candidate_goals = _norm_set(candidate_user.get("goals", []))

    interest_overlap = len(current_interests & candidate_interests)
    goal_overlap = len(current_goals & candidate_goals)

    interest_score = (interest_overlap / max(len(current_interests), 1)) * 40
    goal_score = (goal_overlap / max(len(current_goals), 1)) * 30

    current_keywords = current_interests | current_goals
    candidate_keywords = candidate_interests | candidate_goals
    keyword_overlap = len(current_keywords & candidate_keywords)
    keyword_score = (keyword_overlap / max(len(current_keywords), 1)) * 30

    return int(round(min(100, interest_score + goal_score + keyword_score)))


def _fallback_match(current_user: dict[str, Any], candidate_users: list[dict[str, Any]], reason: str) -> tuple[list[dict[str, Any]], Any]:
    ranked = []
    for candidate in candidate_users:
        ranked.append(
            {
                "name": candidate.get("name", "Unknown"),
                "score": _heuristic_score(current_user, candidate),
                "reason": _build_reason(current_user, candidate),
            }
        )

    ranked.sort(key=lambda item: (int(item.get("score") or 0), str(item.get("name") or "").lower()), reverse=True)
    top_matches = ranked[:3]

    return (
        top_matches,
        {
            "mode": "heuristic-fallback",
            "detail": reason,
            "count": len(top_matches),
        },
    )


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
    users = load_users()
    if not users:
        raise ValueError("No cached users available. Call /refresh-users first.")

    cleaned_new_user = clean_user_record(new_user)
    candidate_users = [clean_user_record(user) for user in users]
    candidate_users = [user for user in candidate_users if not _same_identity(user, cleaned_new_user)]
    if not candidate_users:
        raise ValueError("No other users available to match against.")

    # Render free instances can time out during first-time model bootstrap.
    # Allow opt-in via ENABLE_RAG_ON_RENDER=1 when runtime can handle it.
    if os.getenv("RENDER") and os.getenv("ENABLE_RAG_ON_RENDER", "0") != "1":
        return _fallback_match(
            cleaned_new_user,
            candidate_users,
            "RAG disabled on Render runtime (set ENABLE_RAG_ON_RENDER=1 to enable).",
        )

    rag_model: Any | None = None
    rag_error: str | None = None
    try:
        rag_model = _load_rag_model()
    except RuntimeError as exc:
        rag_error = str(exc)

    if rag_model is None:
        return _fallback_match(cleaned_new_user, candidate_users, rag_error or "RAG model unavailable")

    documents = users_to_documents(candidate_users)
    try:
        if hasattr(rag_model, "match_users") and callable(rag_model.match_users):
            raw_result = rag_model.match_users(cleaned_new_user, documents)
            matches, parsed = _parse_match_output(raw_result)
            if matches:
                return matches, parsed

        # Keep integration simple by using existing model.py functions.
        vectorstore = rag_model.build_vectorstore(candidate_users)
        if not vectorstore:
            raise ValueError("Could not build vector store from users.json")

        candidates = rag_model.retrieve_candidates(cleaned_new_user, vectorstore, k=3)
        raw_result = rag_model.find_best_match(cleaned_new_user, candidates)
        matches, parsed = _parse_match_output(raw_result)
        if matches:
            return matches, parsed

        return _fallback_match(cleaned_new_user, candidate_users, "RAG returned empty match output")
    except Exception as exc:  # noqa: BLE001
        return _fallback_match(cleaned_new_user, candidate_users, f"RAG pipeline failed: {exc}")
