interface WalletConnectProps {
  onConnect?: () => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  return (
    <button
      type="button"
      onClick={onConnect}
      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-headline font-bold hover:-translate-y-0.5 transition-all"
    >
      Connect Wallet
    </button>
  );
}
