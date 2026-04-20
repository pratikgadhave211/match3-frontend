const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const configuredChainId = Number(env.VITE_EXPECTED_CHAIN_ID ?? "666888");

export const RPC_URL = env.VITE_RPC_URL || "https://testnet-rpc.helachain.com";
export const CONTRACT_ADDRESS =
  env.VITE_CONTRACT_ADDRESS || "0xeEdEd492DF09b3f2964c1A6d8927E2883c1994b8";
export const EXPECTED_CHAIN_ID = Number.isFinite(configuredChainId) ? configuredChainId : 666888;
export const EXPECTED_CHAIN_ID_HEX =
  env.VITE_EXPECTED_CHAIN_ID_HEX || `0x${EXPECTED_CHAIN_ID.toString(16)}`;
export const NETWORK_NAME = env.VITE_NETWORK_NAME || "Hela Official Runtime Testnet";
export const CURRENCY_SYMBOL = env.VITE_CURRENCY_SYMBOL || "HLUSD";
export const NATIVE_CURRENCY_NAME = env.VITE_NATIVE_CURRENCY_NAME || "Hela USD";
export const EXPLORER_BASE_URL =
  env.VITE_EXPLORER_BASE_URL || "https://testnet-blockexplorer.helachain.com";

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string[]", "name": "_interests", "type": "string[]" },
      { "internalType": "string[]", "name": "_goals", "type": "string[]" }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "wallet", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string[]", "name": "interests", "type": "string[]" },
      { "indexed": false, "internalType": "string[]", "name": "goals", "type": "string[]" },
      { "indexed": false, "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "fetch",
    "outputs": [
      { "internalType": "address", "name": "wallet", "type": "address" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string[]", "name": "interests", "type": "string[]" },
      { "internalType": "string[]", "name": "goals", "type": "string[]" },
      { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fetchAll",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "wallet", "type": "address" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string[]", "name": "interests", "type": "string[]" },
          { "internalType": "string[]", "name": "goals", "type": "string[]" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
          { "internalType": "bool", "name": "exists", "type": "bool" }
        ],
        "internalType": "struct EventUsers.User[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const SKILL_SUGGESTIONS = [
  "AI",
  "Web3",
  "Rust",
  "Blockchain",
  "Solidity",
  "LLM",
  "DAO",
  "ZK-SNARKS",
  "DeFi",
  "Wasm",
  "Identity",
  "Tokenomics",
  "Security"
];

export const SIDEBAR_NAV: Array<{ id: "home" | "matches" | "connections" | "saved" | "settings"; icon: string; label: string }> = [
  { id: "home", icon: "dashboard", label: "Dashboard" },
  { id: "matches", icon: "auto_awesome", label: "Matches" },
  { id: "connections", icon: "people", label: "Connections" },
  { id: "saved", icon: "bookmark", label: "Saved" },
  { id: "settings", icon: "settings", label: "Settings" }
];
