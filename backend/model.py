import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from backend.web3_fetch_users import fetch_blockchain_users_structured

try:
    from langchain_core.messages import SystemMessage
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
except Exception:  # noqa: BLE001
    SystemMessage = None
    ChatHuggingFace = None
    HuggingFaceEndpoint = None


load_dotenv(override=True)

DB_FILE = Path(__file__).resolve().parent / "data" / "users.json"
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

if not DB_FILE.exists():
    DB_FILE.write_text("[]\n", encoding="utf-8")


_chat_model: Any | None = None
_llm_init_attempted = False


def _normalize_list(values: Any) -> list[str]:
    if isinstance(values, list):
        return [str(value).strip().lower() for value in values if str(value).strip()]

    if isinstance(values, str):
        return [part.strip().lower() for part in values.split(",") if part.strip()]

    return []


def _normalize_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "wallet": str(user.get("wallet") or ""),
        "name": str(user.get("name") or "Unknown").strip(),
        "interests": _normalize_list(user.get("interests")),
        "goals": _normalize_list(user.get("goals")),
    }


def _token_overlap_score(new_user: dict[str, Any], candidate: dict[str, Any]) -> float:
    new_interests = set(_normalize_list(new_user.get("interests")))
    new_goals = set(_normalize_list(new_user.get("goals")))

    candidate_interests = set(_normalize_list(candidate.get("interests")))
    candidate_goals = set(_normalize_list(candidate.get("goals")))

    interest_overlap = len(new_interests & candidate_interests)
    goal_overlap = len(new_goals & candidate_goals)

    denominator = max(1, len(new_interests) + len(new_goals))
    return (interest_overlap * 2 + goal_overlap) / denominator


def _parse_candidate_text(text: str) -> dict[str, Any]:
    name_match = re.search(r"Name:\s*(.*?)\.\s*Interests:", text, re.IGNORECASE)
    interests_match = re.search(r"Interests:\s*(.*?)\.\s*Goals:", text, re.IGNORECASE)
    goals_match = re.search(r"Goals:\s*(.*?)\.?$", text, re.IGNORECASE)

    name = (name_match.group(1).strip() if name_match else "Unknown")
    interests_raw = interests_match.group(1).strip() if interests_match else ""
    goals_raw = goals_match.group(1).strip() if goals_match else ""

    interests = [] if interests_raw.lower() == "none" else _normalize_list(interests_raw)
    goals = [] if goals_raw.lower() == "none" else _normalize_list(goals_raw)

    return {
        "name": name,
        "interests": interests,
        "goals": goals,
    }


def _extract_json_payload(text: str) -> Any | None:
    if not isinstance(text, str):
        return None

    cleaned = text.strip()
    if not cleaned:
        return None

    fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.IGNORECASE | re.DOTALL)
    if fenced_match:
        cleaned = fenced_match.group(1).strip()

    for candidate in (cleaned,):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    object_start = cleaned.find("{")
    object_end = cleaned.rfind("}")
    if object_start != -1 and object_end != -1 and object_end > object_start:
        try:
            return json.loads(cleaned[object_start : object_end + 1])
        except json.JSONDecodeError:
            pass

    list_start = cleaned.find("[")
    list_end = cleaned.rfind("]")
    if list_start != -1 and list_end != -1 and list_end > list_start:
        try:
            return json.loads(cleaned[list_start : list_end + 1])
        except json.JSONDecodeError:
            pass

    return None


def _heuristic_rank(new_user: dict[str, Any], candidates: list[str]) -> dict[str, Any]:
    ranked: list[dict[str, Any]] = []

    for candidate_text in candidates:
        candidate = _parse_candidate_text(candidate_text)
        overlap_score = _token_overlap_score(new_user, candidate)
        score = int(round(55 + overlap_score * 40))
        score = max(0, min(100, score))

        ranked.append(
            {
                "name": candidate.get("name") or "Unknown",
                "score": score,
                "reason": (
                    "Matched using fallback scoring based on interest and goal overlap. "
                    "This result avoids request failure when model inference is unavailable."
                ),
            }
        )

    ranked.sort(key=lambda item: int(item.get("score") or 0), reverse=True)
    return {"matches": ranked[:3], "mode": "fallback"}


def _get_chat_model() -> Any | None:
    global _chat_model
    global _llm_init_attempted

    if _llm_init_attempted:
        return _chat_model

    _llm_init_attempted = True

    if HuggingFaceEndpoint is None or ChatHuggingFace is None or SystemMessage is None:
        _chat_model = None
        return _chat_model

    token = os.getenv("HUGGINGFACEHUB_API_TOKEN", "").strip()
    if not token:
        _chat_model = None
        return _chat_model

    try:
        llm = HuggingFaceEndpoint(
            model="meta-llama/Llama-3.1-8B-Instruct",
            task="text-generation",
            huggingfacehub_api_token=token,
        )
        _chat_model = ChatHuggingFace(llm=llm)
    except Exception:  # noqa: BLE001
        _chat_model = None

    return _chat_model


def load_users() -> list[dict[str, Any]]:
    with open(DB_FILE, "r", encoding="utf-8") as file:
        parsed = json.load(file)

    if not isinstance(parsed, list):
        return []

    return [_normalize_user(item) for item in parsed if isinstance(item, dict)]


def save_users(users: list[dict[str, Any]]) -> None:
    cleaned = [_normalize_user(user) for user in users if isinstance(user, dict)]
    with open(DB_FILE, "w", encoding="utf-8") as file:
        json.dump(cleaned, file, indent=2, ensure_ascii=False)


def rag_text_from_user(user: dict[str, Any]) -> str:
    normalized = _normalize_user(user)
    interests = normalized["interests"]
    goals = normalized["goals"]
    name = normalized["name"]

    interests_text = ", ".join(interests) if interests else "None"
    goals_text = ", ".join(goals) if goals else "None"

    return f"Name: {name}. Interests: {interests_text}. Goals: {goals_text}."


def build_vectorstore(users: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not users:
        return None

    normalized = [_normalize_user(user) for user in users if isinstance(user, dict)]
    if not normalized:
        return None

    return {"mode": "heuristic", "users": normalized}


def get_user_input() -> dict[str, Any]:
    name = input("Enter your name: ")
    interests = input("Enter interests (comma separated): ").split(",")
    goals = input("Enter goals (comma separated): ").split(",")

    return {
        "name": name.strip(),
        "interests": [item.strip() for item in interests if item.strip()],
        "goals": [item.strip() for item in goals if item.strip()],
    }


def retrieve_candidates(new_user: dict[str, Any], vectorstore: dict[str, Any], k: int = 3) -> list[str]:
    users = vectorstore.get("users", []) if isinstance(vectorstore, dict) else []
    if not isinstance(users, list) or not users:
        return []

    cleaned_new_user = _normalize_user(new_user)

    scored: list[tuple[float, dict[str, Any]]] = []
    for user in users:
        cleaned = _normalize_user(user)
        score = _token_overlap_score(cleaned_new_user, cleaned)
        scored.append((score, cleaned))

    scored.sort(key=lambda item: (item[0], item[1].get("name", "")), reverse=True)
    limit = max(1, min(int(k), len(scored)))
    return [rag_text_from_user(user) for _, user in scored[:limit]]


def find_best_match(new_user: dict[str, Any], candidates: list[str]) -> dict[str, Any] | str:
    if not candidates:
        return {"matches": [], "mode": "fallback"}

    model = _get_chat_model()
    if model is None or SystemMessage is None:
        return _heuristic_rank(new_user, candidates)

    prompt = f"""
You are an AI matchmaking assistant for professional networking events.

New User:
Name: {new_user.get('name', 'Unknown')}
Interests: {new_user.get('interests', [])}
Goals: {new_user.get('goals', [])}

Top Retrieved Candidates:
{json.dumps(candidates, indent=2)}

Return only valid JSON in this shape:
{{
  "matches": [
    {{"name": "candidate", "score": 80, "reason": "short reason"}}
  ]
}}
"""

    try:
        response = model.invoke([SystemMessage(content=prompt)])
        content = response.content
        if isinstance(content, str) and content.strip():
            parsed = _extract_json_payload(content)
            if isinstance(parsed, dict) and isinstance(parsed.get("matches"), list):
                return parsed

            if isinstance(parsed, list):
                cleaned_matches = [item for item in parsed if isinstance(item, dict)]
                if cleaned_matches:
                    return {"matches": cleaned_matches[:3], "mode": "llm-list"}
    except Exception:  # noqa: BLE001
        return _heuristic_rank(new_user, candidates)

    return _heuristic_rank(new_user, candidates)


def main() -> None:
    print("\n--- RAG AI Event Matchmaker (Resilient Mode) ---\n")
    print("Fetching users from blockchain...\n")

    try:
        users = fetch_blockchain_users_structured()
    except Exception as exc:  # noqa: BLE001
        print("Failed to fetch blockchain users.")
        print(f"Details: {exc}")
        return

    if not users:
        print("No users fetched from blockchain.")
        return

    save_users(users)
    vectorstore = build_vectorstore(users)
    if not vectorstore:
        print("No users available for matching.")
        return

    new_user = get_user_input()
    candidates = retrieve_candidates(new_user, vectorstore, k=3)
    result = find_best_match(new_user, candidates)

    print("\n=== RESULT ===")
    print(result)
    print(f"\nSaved users to: {DB_FILE}")


if __name__ == "__main__":
    main()