import { BrowserProvider, Contract } from "ethers";
import type { ContractTransactionResponse, JsonRpcSigner } from "ethers";
import type { OnChainUser, RegisterPayload } from "../types";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/constants";
import { getReadOnlyProvider } from "./web3";

export interface ContractCallResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface RegisterUserResult {
  txHash: string;
  status: "pending" | "success";
}

function getInjectedProvider(): { request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown> } {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  return window.ethereum;
}

export async function registerUser(
  name: string,
  interests: string[],
  goals: string[]
): Promise<RegisterUserResult> {
  const injected = getInjectedProvider();

  try {
    await injected.request({ method: "eth_requestAccounts" });

    const provider = new BrowserProvider(injected);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const registerFn = contract.getFunction("register");
    const tx = (await registerFn(name, interests, goals)) as ContractTransactionResponse;

    const txHash = String(tx.hash);
    const receipt = await tx.wait();

    if (!receipt || Number(receipt.status) !== 1) {
      throw new Error("Transaction failed or reverted.");
    }

    return {
      txHash,
      status: "success"
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = Number((error as { code?: number | string }).code);
      if (code === 4001) {
        throw new Error("User rejected the transaction in MetaMask.");
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to submit registration transaction.");
  }
}

export function getRegistrationContract(signer: JsonRpcSigner): Contract {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

function getReadContract(): Contract {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getReadOnlyProvider());
}

function normalizeUser(raw: {
  wallet: string;
  name: string;
  interests: string[];
  goals: string[];
  registeredAt: bigint;
  exists?: boolean;
}): OnChainUser {
  return {
    wallet: raw.wallet,
    name: raw.name,
    interests: raw.interests,
    goals: raw.goals,
    registeredAt: raw.registeredAt,
    exists: raw.exists
  };
}

export async function submitRegistration(
  signer: JsonRpcSigner,
  payload: RegisterPayload
): Promise<ContractTransactionResponse> {
  const contract = getRegistrationContract(signer);
  const registerFn = contract.getFunction("register");
  return registerFn(payload.name, payload.interests, payload.goals);
}

export async function isContractDeployed(): Promise<boolean> {
  const provider = getReadOnlyProvider();
  const code = await provider.getCode(CONTRACT_ADDRESS);
  return code !== "0x";
}

export async function fetchUserProfile(userAddress: string): Promise<OnChainUser | null> {
  const contract = getReadContract();
  const fetchFn = contract.getFunction("fetch");
  const result = (await fetchFn(userAddress)) as {
    wallet: string;
    name: string;
    interests: string[];
    goals: string[];
    registeredAt: bigint;
  };

  const normalized = normalizeUser(result);
  const hasData =
    normalized.wallet !== "0x0000000000000000000000000000000000000000" &&
    (normalized.name.trim().length > 0 || normalized.interests.length > 0 || normalized.goals.length > 0);

  return hasData ? normalized : null;
}

export async function fetchAllProfiles(): Promise<OnChainUser[]> {
  const contract = getReadContract();
  const fetchAllFn = contract.getFunction("fetchAll");
  const result = (await fetchAllFn()) as Array<{
    wallet: string;
    name: string;
    interests: string[];
    goals: string[];
    registeredAt: bigint;
    exists: boolean;
  }>;

  return result
    .map((user) => normalizeUser(user))
    .filter((user) => user.exists !== false);
}

export async function invokeContractMethod(
  method: string,
  args: unknown[] = []
): Promise<ContractCallResult> {
  const argCount = args.length;
  return {
    success: false,
    error:
      `invokeContractMethod("${method}") with ${argCount} args is not signer-aware. ` +
      "Use submitRegistration(signer, payload) for on-chain writes."
  };
}
