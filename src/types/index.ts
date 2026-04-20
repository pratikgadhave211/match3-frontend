import type { BrowserProvider, JsonRpcSigner } from "ethers";

export type ViewId =
  | "home"
  | "matches"
  | "connections"
  | "saved"
  | "settings"
  | "team"
  | "solutions"
  | "blog"
  | "pricing";

export type MatchSort = "high" | "low";

export interface Match {
  name: string;
  role: string;
  category: "Developer" | "Founder" | "Designer";
  avatar: string;
  skills: string[];
  goal: "Startup" | "Networking";
  matchScore: number;
  aiReason: string;
}

export interface Connection extends Match {
  connectedDate: string;
  notes: string;
}

export interface ProfileModalState {
  open: boolean;
  name: string;
  role: string;
  score?: string;
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
}

export interface ConnectedWallet {
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  address: string;
  chainId: number;
  isExpectedNetwork: boolean;
}

export interface RegisterPayload {
  name: string;
  interests: string[];
  goals: string[];
}

export interface OnChainUser {
  wallet: string;
  name: string;
  interests: string[];
  goals: string[];
  registeredAt: bigint;
  exists?: boolean;
}

export type WalletUiState =
  | "wallet_not_connected"
  | "connecting_wallet"
  | "wallet_connected"
  | "wrong_network";

export type TxUiState =
  | "idle"
  | "waiting_signature"
  | "tx_pending"
  | "success"
  | "failed";
