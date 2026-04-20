import { BrowserProvider, JsonRpcProvider } from "ethers";
import type { EthereumProvider } from "../types";
import { EXPECTED_CHAIN_ID, RPC_URL } from "../utils/constants";

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function hasMetaMask(): boolean {
  const injected = getInjectedProvider();
  return Boolean(injected && injected.isMetaMask);
}

export function getBrowserProvider(): BrowserProvider {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("MetaMask is not installed.");
  }
  return new BrowserProvider(injected);
}

export function getReadOnlyProvider(): JsonRpcProvider {
  return new JsonRpcProvider(RPC_URL);
}

export function isExpectedNetwork(chainId: number): boolean {
  return chainId === EXPECTED_CHAIN_ID;
}
