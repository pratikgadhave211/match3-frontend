import { useState } from "react";
import { Link } from "react-router-dom";
import type { ConnectedWallet, OnChainUser, WalletUiState } from "../types";
import { NETWORK_NAME, RPC_URL } from "../utils/constants";
import { formatUnixTimestamp, shortAddress } from "../utils/format";
import { fetchAllProfiles, fetchUserProfile, isContractDeployed } from "../services/contract";
import { connectMetaMask, switchToExpectedNetwork } from "../services/wallet";
import { hasMetaMask } from "../services/web3";

function getErrorMessage(error: unknown): string {
  const rawErrorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  const nestedMessage =
    typeof error === "object" && error !== null && "error" in error
      ? String((error as { error?: { message?: unknown } }).error?.message ?? "")
      : "";

  const combinedMessage = `${rawErrorMessage} ${nestedMessage}`.trim();

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = Number((error as { code?: number | string }).code);
    if (errorCode === 4001) {
      return "Request rejected in MetaMask.";
    }

    if (errorCode === -32603 && combinedMessage.toLowerCase().includes("failed to fetch")) {
      return (
        "Wallet RPC is unreachable. " +
        `Open MetaMask → ${NETWORK_NAME} settings and set RPC to ${RPC_URL}, then retry.`
      );
    }
  }

  if (combinedMessage.toLowerCase().includes("failed to fetch")) {
    return `RPC request failed. If you are using MetaMask, set ${NETWORK_NAME} RPC to ${RPC_URL} and retry.`;
  }

  if (rawErrorMessage) return rawErrorMessage;
  return "Unexpected error occurred. Please try again.";
}

function UserCard({ user }: { user: OnChainUser }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-semibold text-white">{user.name || "Unnamed"}</div>
        <div className="text-xs text-white/65">{shortAddress(user.wallet)}</div>
      </div>
      <div className="mt-2 text-xs text-white/65">
        Registered: {formatUnixTimestamp(user.registeredAt)}
      </div>

      {user.interests.length > 0 ? (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/55">
            Interests
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.interests.map((interest) => (
              <span
                key={`${user.wallet}-interest-${interest}`}
                className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {user.goals.length > 0 ? (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/55">Goals</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.goals.map((goal) => (
              <span
                key={`${user.wallet}-goal-${goal}`}
                className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/80"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MatchmakingPage() {
  const [walletState, setWalletState] = useState<WalletUiState>("wallet_not_connected");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const [profile, setProfile] = useState<OnChainUser | null>(null);
  const [allProfiles, setAllProfiles] = useState<OnChainUser[]>([]);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const connectWallet = async () => {
    setErrorMessage("");

    if (!hasMetaMask()) {
      setWalletState("wallet_not_connected");
      setErrorMessage("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    try {
      setWalletState("connecting_wallet");
      const connected = await connectMetaMask();
      setWallet(connected);

      if (!connected.isExpectedNetwork) {
        setWalletState("wrong_network");
        setErrorMessage(`Please switch to ${NETWORK_NAME}.`);
        return;
      }

      setWalletState("wallet_connected");
    } catch (error) {
      setWalletState("wallet_not_connected");
      setErrorMessage(getErrorMessage(error));
    }
  };

  const switchNetwork = async () => {
    setErrorMessage("");
    setIsSwitchingNetwork(true);

    try {
      await switchToExpectedNetwork();
      const connected = await connectMetaMask();
      setWallet(connected);

      if (!connected.isExpectedNetwork) {
        setWalletState("wrong_network");
        setErrorMessage(`Please switch to ${NETWORK_NAME}.`);
        return;
      }

      setWalletState("wallet_connected");
    } catch (error) {
      setWalletState("wrong_network");
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const loadMyProfile = async () => {
    if (!wallet) {
      setErrorMessage("Connect your wallet first.");
      return;
    }

    if (!wallet.isExpectedNetwork) {
      setWalletState("wrong_network");
      setErrorMessage(`Please switch to ${NETWORK_NAME}.`);
      return;
    }

    setErrorMessage("");
    setIsLoadingProfile(true);

    try {
      const deployed = await isContractDeployed();
      if (!deployed) {
        setErrorMessage("Contract is not deployed on the selected network.");
        setProfile(null);
        return;
      }

      const result = await fetchUserProfile(wallet.address);
      setProfile(result);
      if (!result) {
        setErrorMessage("No on-chain profile found for this wallet yet.");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadAll = async () => {
    setErrorMessage("");
    setIsLoadingAll(true);

    try {
      const deployed = await isContractDeployed();
      if (!deployed) {
        setErrorMessage("Contract is not deployed on the selected network.");
        setAllProfiles([]);
        return;
      }

      const result = await fetchAllProfiles();
      setAllProfiles(result);
      if (result.length === 0) {
        setErrorMessage("No on-chain profiles found yet.");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setAllProfiles([]);
    } finally {
      setIsLoadingAll(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-16 md:px-12">
      <div className="gradient-orb gradient-orb--one" />
      <div className="gradient-orb gradient-orb--two" />

      <section className="mx-auto max-w-4xl glass-panel rounded-3xl border border-white/15 p-8 md:p-12 animate-rise">
        <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Matchmaking
        </span>
        <h1 className="mt-5 text-4xl font-headline font-black text-white md:text-5xl">
          Load On-Chain Attendees
        </h1>
        <p className="mt-3 max-w-2xl text-base text-white/75 md:text-lg">
          Use the read-only RPC to confirm that registration data is available on {NETWORK_NAME}.
        </p>

        <div className="mt-7 rounded-2xl border border-white/15 bg-black/20 p-5">
          <h2 className="text-lg font-headline font-bold text-white">Wallet</h2>
          <p className="mt-1 text-sm text-white/70">Network required: {NETWORK_NAME}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={connectWallet}
              disabled={walletState === "connecting_wallet"}
              className="rounded-xl border border-primary/40 bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(176,127,241,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {walletState === "connecting_wallet" ? "Connecting wallet..." : "Connect MetaMask"}
            </button>

            {walletState === "wrong_network" ? (
              <button
                type="button"
                onClick={switchNetwork}
                disabled={isSwitchingNetwork}
                className="rounded-xl border border-yellow-300/50 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitchingNetwork ? "Switching network..." : `Switch to ${NETWORK_NAME}`}
              </button>
            ) : null}
          </div>

          {wallet ? (
            <div className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
              Connected wallet: {shortAddress(wallet.address)}
            </div>
          ) : null}

          {walletState === "wrong_network" ? (
            <div className="mt-4 status-pill status-pill--warning">Wrong network. Switch to {NETWORK_NAME}.</div>
          ) : null}

          {errorMessage ? <div className="mt-4 status-pill status-pill--danger">{errorMessage}</div> : null}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={loadMyProfile}
            disabled={isLoadingProfile}
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoadingProfile ? "Loading my profile..." : "Load My Profile"}
          </button>
          <button
            type="button"
            onClick={loadAll}
            disabled={isLoadingAll}
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoadingAll ? "Loading attendees..." : "Load All Attendees"}
          </button>
        </div>

        {profile ? (
          <div className="mt-7">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              My Profile
            </h2>
            <div className="mt-3">
              <UserCard user={profile} />
            </div>
          </div>
        ) : null}

        <div className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Attendees {allProfiles.length > 0 ? `(${allProfiles.length})` : ""}
          </h2>
          <div className="mt-3 grid gap-3">
            {allProfiles.slice(0, 25).map((user) => (
              <UserCard key={user.wallet} user={user} />
            ))}
          </div>
          {allProfiles.length > 25 ? (
            <p className="mt-3 text-xs text-white/60">Showing first 25 results.</p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Back to Register
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-primary/40 bg-primary px-5 py-3 font-semibold text-on-primary transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(176,127,241,0.45)]"
          >
            Go to Landing
          </Link>
        </div>
      </section>
    </main>
  );
}
