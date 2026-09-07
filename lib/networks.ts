export type NetworkName = "bradbury" | "studionet" | "studio-dev" | "localnet";

export type ResolveNetwork = {
  name: NetworkName;
  label: string;
  chainId: number;
  rpcUrl?: string;
  explorerUrl?: string;
  faucetUrl?: string;
};

const selected = (process.env.NEXT_PUBLIC_NETWORK ?? "bradbury") as NetworkName;

const fallbackChainIds: Record<NetworkName, number> = {
  bradbury: 4221,
  studionet: 61999,
  "studio-dev": 61997,
  localnet: 61127
};

const labels: Record<NetworkName, string> = {
  bradbury: "GenLayer Testnet Bradbury",
  studionet: "GenLayer Studionet",
  "studio-dev": "GenLayer Studio development preview",
  localnet: "GenLayer Localnet"
};

export const ACTIVE_NETWORK: ResolveNetwork = {
  name: selected,
  label: labels[selected] ?? labels.bradbury,
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? fallbackChainIds[selected] ?? fallbackChainIds.bradbury),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL,
  faucetUrl: process.env.NEXT_PUBLIC_FAUCET_URL
};

export function chainIdHex(chainId = ACTIVE_NETWORK.chainId) {
  return `0x${chainId.toString(16)}`;
}

export function txExplorerUrl(hash?: string) {
  if (!hash || !ACTIVE_NETWORK.explorerUrl) return undefined;
  return `${ACTIVE_NETWORK.explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function contractExplorerUrl(address?: string) {
  if (!address || !ACTIVE_NETWORK.explorerUrl) return undefined;
  return `${ACTIVE_NETWORK.explorerUrl.replace(/\/$/, "")}/address/${address}`;
}
