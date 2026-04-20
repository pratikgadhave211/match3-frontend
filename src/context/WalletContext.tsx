import { createContext, useContext, type ReactNode } from "react";
import { useWallet } from "../hooks/useWallet";

interface WalletContextValue {
  session: ReturnType<typeof useWallet>["session"];
  connect: ReturnType<typeof useWallet>["connect"];
  disconnect: ReturnType<typeof useWallet>["disconnect"];
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}
