import { useState } from "react";
import type { WalletSession } from "../services/wallet";
import { connectWallet, disconnectWallet } from "../services/wallet";

export function useWallet() {
  const [session, setSession] = useState<WalletSession | null>(null);

  const connect = async () => {
    const connected = await connectWallet();
    setSession(connected);
  };

  const disconnect = async () => {
    await disconnectWallet();
    setSession(null);
  };

  return { session, connect, disconnect };
}
