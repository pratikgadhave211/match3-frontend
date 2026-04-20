import type { ConnectedWallet } from "../types";
import {
  CURRENCY_SYMBOL,
  EXPECTED_CHAIN_ID,
  EXPECTED_CHAIN_ID_HEX,
  EXPLORER_BASE_URL,
  NATIVE_CURRENCY_NAME,
  NETWORK_NAME,
  RPC_URL
} from "../utils/constants";
import { getBrowserProvider, getInjectedProvider } from "./web3";

export interface WalletSession {
  address: string;
  chainId: string;
}

function parseWalletError(error: unknown): Error {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code?: number | string }).code);
    if (code === 4001) {
      return new Error("User rejected wallet request.");
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Wallet operation failed.");
}

export async function getCurrentAccount(): Promise<string | null> {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    const accounts = (await injected.request({ method: "eth_accounts" })) as string[];
    return accounts[0] ?? null;
  } catch (error) {
    throw parseWalletError(error);
  }
}

export async function checkNetwork(): Promise<boolean> {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    const chainIdHex = (await injected.request({ method: "eth_chainId" })) as string;
    const chainId = Number(chainIdHex);
    return chainId === EXPECTED_CHAIN_ID;
  } catch (error) {
    throw parseWalletError(error);
  }
}

export async function connectMetaMask(): Promise<ConnectedWallet> {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("MetaMask is not installed.");
  }

  await injected.request({ method: "eth_requestAccounts" });

  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  return {
    provider,
    signer,
    address,
    chainId,
    isExpectedNetwork: chainId === EXPECTED_CHAIN_ID
  };
}

export async function switchToExpectedNetwork(): Promise<void> {
  const injected = getInjectedProvider();
  if (!injected) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: EXPECTED_CHAIN_ID_HEX }]
    });
  } catch (error) {
    const code = Number((error as { code?: number | string })?.code);

    if (code !== 4902) {
      throw error;
    }

    await injected.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: EXPECTED_CHAIN_ID_HEX,
          chainName: NETWORK_NAME,
          nativeCurrency: { name: NATIVE_CURRENCY_NAME, symbol: CURRENCY_SYMBOL, decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_BASE_URL]
        }
      ]
    });
  }
}

export async function connectWallet(): Promise<WalletSession | null> {
  try {
    const injected = getInjectedProvider();
    if (!injected) {
      throw new Error("MetaMask is not installed.");
    }

    await injected.request({ method: "eth_requestAccounts" });
    const isExpectedNetwork = await checkNetwork();
    if (!isExpectedNetwork) {
      throw new Error(`Wrong network. Please switch to ${NETWORK_NAME}.`);
    }

    const connected = await connectMetaMask();
    return { address: connected.address, chainId: String(connected.chainId) };
  } catch {
    return null;
  }
}

export async function disconnectWallet(): Promise<void> {
  return Promise.resolve();
}
