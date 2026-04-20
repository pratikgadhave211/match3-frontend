import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/ui/Toast";
import type { ConnectedWallet, TxUiState, WalletUiState } from "../types";
import { CONTRACT_ADDRESS, NETWORK_NAME, RPC_URL } from "../utils/constants";
import { shortAddress } from "../utils/format";
import { fetchUserProfile, isContractDeployed, registerUser } from "../services/contract";
import { connectMetaMask, switchToExpectedNetwork } from "../services/wallet";
import { hasMetaMask } from "../services/web3";

function parseCommaSeparatedValues(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getErrorMessage(error: unknown): string {
  const rawErrorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  const nestedMessage =
    typeof error === "object" && error !== null && "error" in error
      ? String((error as { error?: { message?: unknown } }).error?.message ?? "")
      : "";

  const combinedMessage = `${rawErrorMessage} ${nestedMessage}`;

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = Number((error as { code?: number | string }).code);
    if (errorCode === 4001) {
      return "Request rejected in MetaMask.";
    }

    if (errorCode === -32603 && combinedMessage.toLowerCase().includes("failed to fetch")) {
      return (
        `MetaMask could not reach the active ${NETWORK_NAME} RPC while sending the transaction. ` +
        `Open MetaMask network settings and set ${NETWORK_NAME} RPC to ${RPC_URL}, then retry.`
      );
    }
  }

  if (
    combinedMessage.includes("could not coalesce error") ||
    combinedMessage.toLowerCase().includes("failed to fetch")
  ) {
    return (
      "Transaction broadcast failed because the wallet RPC endpoint is unreachable. " +
      `Switch to ${NETWORK_NAME} again and retry. If needed, set RPC URL to ${RPC_URL}.`
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unexpected error occurred. Please try again.";
}

function isAlreadyRegisteredError(error: unknown): boolean {
  const rawErrorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  const nestedMessage =
    typeof error === "object" && error !== null && "error" in error
      ? String((error as { error?: { message?: unknown } }).error?.message ?? "")
      : "";

  const combined = `${rawErrorMessage} ${nestedMessage}`.toLowerCase();
  return combined.includes("already") && (combined.includes("exist") || combined.includes("registered"));
}

export default function RegisterOnChainPage() {
  const navigate = useNavigate();

  const [walletState, setWalletState] = useState<WalletUiState>("wallet_not_connected");
  const [txState, setTxState] = useState<TxUiState>("idle");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [rpcState, setRpcState] = useState<"unknown" | "checking" | "reachable" | "unreachable">(
    "unknown"
  );

  const [name, setName] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [goalsInput, setGoalsInput] = useState("");

  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const isBusy = txState === "waiting_signature" || txState === "tx_pending";

  const canSubmit = useMemo(() => {
    return (
      walletState === "wallet_connected" &&
      Boolean(wallet) &&
      !isBusy &&
      rpcState === "reachable" &&
      name.trim().length > 0
    );
  }, [walletState, wallet, isBusy, name, rpcState]);

  const checkWalletRpc = async (connected: ConnectedWallet): Promise<boolean> => {
    setRpcState("checking");

    try {
      await Promise.race([
        connected.provider.getBlockNumber(),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("MetaMask RPC request timed out")), 8000)
        )
      ]);

      setRpcState("reachable");
      return true;
    } catch {
      setRpcState("unreachable");
      setErrorMessage(
        `MetaMask is connected, but its active ${NETWORK_NAME} RPC is unreachable. ` +
          `In MetaMask → Settings → Networks → ${NETWORK_NAME}, set the RPC URL to ${RPC_URL}, then retry.`
      );
      return false;
    }
  };

  const connectWallet = async () => {
    setErrorMessage("");
    setRpcState("unknown");

    if (!hasMetaMask()) {
      setWalletState("wallet_not_connected");
      setErrorMessage("MetaMask is not installed. Please install MetaMask to continue.");
      setToastMessage("MetaMask is not installed.");
      return;
    }

    try {
      setWalletState("connecting_wallet");
      const connected = await connectMetaMask();
      setWallet(connected);

      if (!connected.isExpectedNetwork) {
        setWalletState("wrong_network");
        setErrorMessage(`Please switch to ${NETWORK_NAME}`);
        return;
      }

      setWalletState("wallet_connected");
      await checkWalletRpc(connected);
    } catch (error) {
      setWalletState("wallet_not_connected");
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setToastMessage(message);
    }
  };

  const switchNetwork = async () => {
    setErrorMessage("");
    setIsSwitchingNetwork(true);
    setRpcState("unknown");

    try {
      await switchToExpectedNetwork();
      const connected = await connectMetaMask();
      setWallet(connected);

      if (!connected.isExpectedNetwork) {
        setWalletState("wrong_network");
        setErrorMessage(`Please switch to ${NETWORK_NAME}`);
        return;
      }

      setWalletState("wallet_connected");
      await checkWalletRpc(connected);
    } catch (error) {
      setWalletState("wrong_network");
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setToastMessage(message);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const registerOnChain = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!wallet) {
      setErrorMessage("Connect your wallet first.");
      return;
    }

    if (!wallet.isExpectedNetwork) {
      setWalletState("wrong_network");
      setErrorMessage(`Please switch to ${NETWORK_NAME}`);
      return;
    }

    const interests = parseCommaSeparatedValues(interestsInput);
    const goals = parseCommaSeparatedValues(goalsInput);

    try {
      const deployed = await isContractDeployed();
      if (!deployed) {
        setTxState("failed");
        setErrorMessage(
          `No contract bytecode found at ${CONTRACT_ADDRESS} on ${NETWORK_NAME}. Check address or selected network.`
        );
        return;
      }

      const rpcReachable = await checkWalletRpc(wallet);
      if (!rpcReachable) {
        setTxState("idle");
        return;
      }

      // If the user already registered, skip tx and take them to dashboard.
      try {
        const existing = await fetchUserProfile(wallet.address);
        if (existing) {
          navigate("/dashboard", {
            replace: true,
            state: { toast: "Already registered — welcome back." }
          });
          return;
        }
      } catch {
        // Ignore read failures and allow normal registration attempt.
      }

      setTxState("waiting_signature");

      const registration = await registerUser(name.trim(), interests, goals);
      setTxHash(registration.txHash);
      setTxState("success");
      setToastMessage("Registration successful");

      window.localStorage.setItem(
        "currentUserProfile",
        JSON.stringify({
          name: name.trim(),
          interests,
          goals,
          wallet: wallet.address
        })
      );

      navigate("/dashboard", {
        replace: true,
        state: { toast: "Registration successful — logged in." }
      });
    } catch (error) {
      if (isAlreadyRegisteredError(error)) {
        setTxState("success");
        navigate("/dashboard", {
          replace: true,
          state: { toast: "Already registered — logged in." }
        });
        return;
      }

      setTxState("failed");
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setToastMessage(message);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-16 md:px-10 lg:px-14">
      <div className="gradient-orb gradient-orb--one" />
      <div className="gradient-orb gradient-orb--two" />

      <section className="mx-auto max-w-4xl animate-rise">
        <div className="glass-panel rounded-3xl border border-white/15 p-7 md:p-10">
          <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            {NETWORK_NAME} Registration
          </span>
          <h1 className="mt-5 text-3xl font-headline font-black text-white md:text-5xl">
            Register Your Profile On-Chain
          </h1>
          <p className="mt-3 text-base text-white/75 md:text-lg">
            Connect your wallet and save your profile directly on-chain to participate in trusted,
            verifiable matchmaking.
          </p>

          <div className="mt-7 rounded-2xl border border-white/15 bg-black/20 p-5">
            <h2 className="text-lg font-headline font-bold text-white">Connect MetaMask</h2>
            <p className="mt-1 text-sm text-white/70">
              Network required: {NETWORK_NAME}
            </p>

            <button
              type="button"
              onClick={connectWallet}
              disabled={walletState === "connecting_wallet"}
              className="mt-4 rounded-xl border border-primary/40 bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(176,127,241,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {walletState === "connecting_wallet" ? "Connecting wallet..." : "Connect MetaMask"}
            </button>

            {wallet ? (
              <div className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                Connected wallet: {shortAddress(wallet.address)}
              </div>
            ) : null}
          </div>

          <form onSubmit={registerOnChain} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Pratik Sharma"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90" htmlFor="interests">
                Interests (comma separated)
              </label>
              <input
                id="interests"
                value={interestsInput}
                onChange={(event) => setInterestsInput(event.target.value)}
                placeholder="AI, Web3, DAOs"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90" htmlFor="goals">
                Goals (comma separated)
              </label>
              <input
                id="goals"
                value={goalsInput}
                onChange={(event) => setGoalsInput(event.target.value)}
                placeholder="Find cofounder, Join team"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {txState === "waiting_signature"
                ? "Waiting for MetaMask confirmation..."
                : txState === "tx_pending"
                  ? "Transaction pending..."
                  : "Register On-Chain"}
            </button>
          </form>

          <div className="mt-7 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              Transaction States
            </h3>

            <div className="status-pill">
              Wallet: {walletState === "wallet_not_connected" ? "Wallet not connected" : walletState === "connecting_wallet" ? "Connecting wallet..." : walletState === "wrong_network" ? "Wrong network" : "Wallet connected"}
            </div>
              <div className="status-pill">
                RPC: {rpcState === "unknown" ? "Unknown" : rpcState === "checking" ? "Checking..." : rpcState === "reachable" ? "Reachable" : "Unreachable"}
              </div>
            <div className="status-pill">
              Transaction: {txState === "idle" ? "Idle" : txState === "waiting_signature" ? "Waiting for MetaMask confirmation..." : txState === "tx_pending" ? "Transaction pending..." : txState === "success" ? "Registration successful" : "Registration failed"}
            </div>

            {walletState === "wrong_network" ? (
              <div className="status-pill status-pill--warning">
                Please switch to {NETWORK_NAME}
              </div>
            ) : null}

            {walletState === "wrong_network" ? (
              <button
                type="button"
                onClick={switchNetwork}
                disabled={isSwitchingNetwork}
                className="w-full rounded-xl border border-yellow-300/50 bg-yellow-500/15 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitchingNetwork ? "Switching network..." : `Switch to ${NETWORK_NAME}`}
              </button>
            ) : null}

            {txHash ? (
              <div className="status-pill status-pill--success">
                Tx Hash: <span className="break-all">{txHash}</span>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="status-pill status-pill--danger">{errorMessage}</div>
            ) : null}
          </div>

          {txState === "success" && wallet ? (
            <div className="mt-7 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-5 text-emerald-100 animate-rise">
              <h4 className="text-lg font-bold">Logged in</h4>
              <p className="mt-2 text-sm text-emerald-100/90">
                Redirecting to dashboard for {shortAddress(wallet.address)}...
              </p>
              {txHash ? <p className="mt-1 text-xs break-all">{txHash}</p> : null}
            </div>
          ) : null}
         </div>
       </section>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
     </main>
   );
 }
