export function shortAddress(address: string, prefix = 6, suffix = 4): string {
  if (!address || address.length <= prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatUnixTimestamp(unixSeconds: bigint): string {
  if (unixSeconds <= 0n) return "-";

  const asNumber = Number(unixSeconds);
  if (Number.isNaN(asNumber) || !Number.isFinite(asNumber)) return "-";

  return new Date(asNumber * 1000).toLocaleString();
}
