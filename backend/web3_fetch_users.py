from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, List

from web3 import Web3

# -----------------------------
# Contract configuration
# -----------------------------
CONTRACT_ADDRESS = "0x1D67D3511BEDd04208D419fcf559CC5f5975edEf"
EXPECTED_CHAIN_ID = "11155111"
NETWORK_NAME = "Sepolia Test Network"
RPC_URL = "https://sepolia.infura.io/v3/e0147d99ceeb41e1835d2e09f4d4ce27"
CURRENCY_SYMBOL = "ETH"
BLOCK_EXPLORER_URL = "https://sepolia.etherscan.io"

CONTRACT_ABI: List[dict[str, Any]] = [
    {
        "inputs": [
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string[]", "name": "_interests", "type": "string[]"},
            {"internalType": "string[]", "name": "_goals", "type": "string[]"},
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "wallet",
                "type": "address",
            },
            {
                "indexed": False,
                "internalType": "string",
                "name": "name",
                "type": "string",
            },
            {
                "indexed": False,
                "internalType": "string[]",
                "name": "interests",
                "type": "string[]",
            },
            {
                "indexed": False,
                "internalType": "string[]",
                "name": "goals",
                "type": "string[]",
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "registeredAt",
                "type": "uint256",
            },
        ],
        "name": "UserRegistered",
        "type": "event",
    },
    {
        "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
        "name": "fetch",
        "outputs": [
            {"internalType": "address", "name": "wallet", "type": "address"},
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "string[]", "name": "interests", "type": "string[]"},
            {"internalType": "string[]", "name": "goals", "type": "string[]"},
            {
                "internalType": "uint256",
                "name": "registeredAt",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "fetchAll",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "wallet",
                        "type": "address",
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string",
                    },
                    {
                        "internalType": "string[]",
                        "name": "interests",
                        "type": "string[]",
                    },
                    {
                        "internalType": "string[]",
                        "name": "goals",
                        "type": "string[]",
                    },
                    {
                        "internalType": "uint256",
                        "name": "registeredAt",
                        "type": "uint256",
                    },
                    {
                        "internalType": "bool",
                        "name": "exists",
                        "type": "bool",
                    },
                ],
                "internalType": "struct EventUsers.User[]",
                "name": "",
                "type": "tuple[]",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
]

USERS_FILE = Path(__file__).resolve().parent / "data" / "users.json"


@dataclass
class AppState:
    users: List[str] = field(default_factory=list)
    structured_users: List[dict[str, Any]] = field(default_factory=list)
    loading: bool = False
    error: str = ""
    show_popup: bool = False
    popup_message: str = ""


def as_string_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item)]

    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]

    if value is None:
        return []

    return [str(value)]


def normalize_user(user: Any) -> dict[str, Any]:
    if isinstance(user, (list, tuple)):
        name = str(user[1] if len(user) > 1 else "Unknown")
        interests = as_string_list(user[2] if len(user) > 2 else [])
        goals = as_string_list(user[3] if len(user) > 3 else [])
        return {"name": name, "interests": interests, "goals": goals}

    if isinstance(user, dict):
        name = str(user.get("name") or "Unknown")
        interests = as_string_list(user.get("interests"))
        goals = as_string_list(user.get("goals"))
        return {"name": name, "interests": interests, "goals": goals}

    return {"name": "Unknown", "interests": [], "goals": []}


def format_user_for_rag(user: Any) -> str:
    normalized = normalize_user(user)
    interests = normalized["interests"]
    goals = normalized["goals"]

    interests_text = ", ".join(interests) if interests else "None"
    goals_text = ", ".join(goals) if goals else "None"

    return f"Name: {normalized['name']}. Interests: {interests_text}. Goals: {goals_text}."


def show_popup(title: str, message: str) -> None:
    # CLI equivalent of toast/modal notification.
    print(f"\n[{title}] {message}\n")


def fetch_blockchain_users_structured() -> List[dict[str, Any]]:
    web3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not web3.is_connected():
        raise RuntimeError("Could not connect to Sepolia RPC")

    chain_id = str(web3.eth.chain_id)
    if chain_id != EXPECTED_CHAIN_ID:
        raise RuntimeError(f"Please use {NETWORK_NAME}")

    contract = web3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI
    )
    raw_users = contract.functions.fetchAll().call()

    normalized_users: List[dict[str, Any]] = []
    for user in raw_users:
        normalized = normalize_user(user)
        wallet = ""
        if isinstance(user, (list, tuple)) and len(user) > 0:
            wallet = str(user[0])
        elif isinstance(user, dict):
            wallet = str(user.get("wallet") or "")
        normalized_users.append(
            {
                "wallet": wallet,
                "name": normalized["name"],
                "interests": normalized["interests"],
                "goals": normalized["goals"],
            }
        )

    return normalized_users


def fetch_users_from_blockchain(state: AppState) -> None:
    state.loading = True
    state.error = ""

    try:
        raw_users = fetch_blockchain_users_structured()
        state.structured_users = raw_users

        state.users = [format_user_for_rag(user) for user in raw_users]
        state.popup_message = "User data fetched from blockchain successfully"
        state.show_popup = True
        show_popup("Success", state.popup_message)
    except Exception as exc:  # noqa: BLE001
        state.error = "Failed to fetch data"
        state.popup_message = "Failed to fetch data"
        state.show_popup = True
        show_popup("Error", state.popup_message)
        print(f"Details: {exc}")
    finally:
        state.loading = False


def main() -> None:
    state = AppState()

    print("Blockchain User Fetch Demo (web3.py)")
    print(f"Network: {NETWORK_NAME} ({CURRENCY_SYMBOL})")
    print(f"Explorer: {BLOCK_EXPLORER_URL}")

    fetch_users_from_blockchain(state)

    if state.structured_users:
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as file:
            json.dump(state.structured_users, file, indent=2, ensure_ascii=False)

    if state.users:
        print("\nRAG Text Output")
        for idx, user_text in enumerate(state.users, start=1):
            print(f"{idx}. {user_text}")

    if state.structured_users:
        print(f"\nSaved structured blockchain users to {USERS_FILE}")


if __name__ == "__main__":
    main()
