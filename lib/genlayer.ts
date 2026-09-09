"use client";

import { ACTIVE_NETWORK } from "./networks";
import { CONTRACT_ADDRESS, normalizeMarket, normalizeStake, type Address, type Market, type MarketSide, type Stake } from "./contract";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<any>;
  providers?: EthereumProvider[];
  isRabby?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

function walletProvider(): EthereumProvider | undefined {
  const injected = window.ethereum;
  return injected?.providers?.find((provider) => provider.isRabby) ?? injected;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function requireAddress(): Address {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not configured.");
  }
  return CONTRACT_ADDRESS;
}

function toBigInt(value: unknown): bigint {
  if (value === undefined || value === null || value === "") return 0n;
  if (typeof value === "object" && value !== null && "value" in value) {
    return toBigInt((value as { value?: unknown }).value);
  }
  return BigInt(value as bigint | number | string);
}

async function getSdk() {
  const sdk = await import("genlayer-js");
  const chains = await import("genlayer-js/chains");
  return { sdk: sdk as any, chains: chains as any };
}

function chainFromModule(chains: any) {
  if (ACTIVE_NETWORK.name === "bradbury") return chains.testnetBradbury ?? chains.bradbury;
  if (ACTIVE_NETWORK.name === "studionet") return chains.studionet;
  if (ACTIVE_NETWORK.name === "studio-dev") return chains.studioDevnet ?? chains.studioDev;
  return chains.localnet ?? chains.studioDevnet;
}

export async function createReadClient() {
  const { sdk, chains } = await getSdk();
  const chain = chainFromModule(chains) ?? {
    id: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.label,
    rpcUrls: { default: { http: [ACTIVE_NETWORK.rpcUrl] } }
  };
  return sdk.createClient({ chain });
}

export async function createWriteClient(address: Address) {
  const provider = walletProvider();
  if (!provider) throw new Error("Rabby wallet was not found.");
  const { sdk, chains } = await getSdk();
  const chain = chainFromModule(chains) ?? {
    id: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.label,
    rpcUrls: { default: { http: [ACTIVE_NETWORK.rpcUrl] } }
  };
  const client = sdk.createClient({
    chain,
    account: address,
    provider
  });
  // Do not call the SDK's connect helper here. Older SDKs probe MetaMask
  // Snap methods that Rabby does not implement. WalletProvider handles the
  // explicit chain switch through the standard EIP-1193 methods.
  return client;
}

export async function readContract<T>(functionName: string, args: unknown[] = []): Promise<T> {
  const client = await createReadClient();
  return client.readContract({
    address: requireAddress(),
    functionName,
    args
  });
}

export async function writeContract(
  account: Address,
  functionName: string,
  args: unknown[] = [],
  value?: bigint
): Promise<{ hash: string; receipt: any }> {
  const client = await createWriteClient(account);
  const call: any = {
    address: requireAddress(),
    functionName,
    args,
    // genlayer-js 0.19.x converts this field with BigInt internally and
    // throws when it is omitted, even for non-payable methods.
    value: value ?? 0n,
    // The legacy client also expects this optional consensus setting to be
    // present when it builds the transaction payload.
    consensusMaxRotations: 0
  };
  // Fee estimation was added after the SDK version used by Studio-dev.
  // Use it when available, but keep older Studio clients on their native
  // write path instead of calling an undefined method.
  const writeRequest: any = { ...call };
  if (typeof client.estimateTransactionFeesForWrite === "function") {
    const estimate = await client.estimateTransactionFeesForWrite(call);
    writeRequest.fees = {
      distribution: estimate.distribution,
      feeValue: estimate.feeValue
    };
  }
  const hash = await client.writeContract(writeRequest);
  const receipt =
    typeof client.waitForFinalization === "function"
      ? await client.waitForFinalization({ hash })
      : await client.waitForTransactionReceipt({ hash, waitUntil: "finalized" });
  const sdkModule = (await import("genlayer-js")) as any;
  const ok = typeof sdkModule.isSuccessful === "function" ? sdkModule.isSuccessful(receipt) : true;
  if (!ok) {
    throw new Error(`Write failed: ${receipt.statusName ?? "unknown"} / ${receipt.txExecutionResultName ?? "unknown"}`);
  }
  return { hash, receipt };
}

export async function listMarkets(): Promise<Market[]> {
  if (!CONTRACT_ADDRESS) return [];
  const raw = await readContract<any[] | string>("list_markets");
  const markets = typeof raw === "string" ? JSON.parse(raw) : raw;
  return markets.map(normalizeMarket);
}

export async function getMarket(id: number): Promise<Market> {
  return normalizeMarket(await readContract("get_market", [id]));
}

export async function getStake(id: number, user: Address): Promise<Stake> {
  return normalizeStake(await readContract("get_stake", [id, user]));
}

export async function getClaimable(id: number, user: Address): Promise<bigint> {
  return toBigInt(await readContract("get_claimable", [id, user]));
}

export async function getWithdrawable(user: Address): Promise<bigint> {
  return toBigInt(await readContract("get_withdrawable", [user]));
}

export async function stakeMarket(account: Address, id: number, side: MarketSide, amountWei: bigint) {
  return writeContract(account, "stake", [id, side, amountWei]);
}

export async function resolveMarket(account: Address, id: number) {
  return writeContract(account, "resolve", [id]);
}

export async function claimMarket(account: Address, id: number) {
  return writeContract(account, "claim", [id]);
}

export async function withdraw(account: Address) {
  return writeContract(account, "withdraw");
}

export async function createMarket(
  account: Address,
  args: [string, string, string, string, string, string, number]
) {
  return writeContract(account, "create_market", args);
}

export async function cancelMarket(account: Address, id: number) {
  return writeContract(account, "cancel_market", [id]);
}

export function parseGEN(value: string): bigint {
  const clean = value.trim();
  if (!clean) return 0n;
  const [whole, fraction = ""] = clean.split(".");
  const decimals = (fraction + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * 10n ** 18n + BigInt(decimals || "0");
}

export function formatGEN(value: bigint | number | string | undefined): string {
  const wei = BigInt(value ?? 0);
  const whole = wei / 10n ** 18n;
  const fraction = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction} GEN` : `${whole} GEN`;
}

export function humanizeError(error: unknown): string {
  const errorObject = error as any;
  const message =
    error instanceof Error
      ? error.message
      : errorObject?.shortMessage || errorObject?.details || errorObject?.message || errorObject?.cause?.message;
  const fallback = (() => {
    if (message) return String(message);
    if (error && typeof error === "object") {
      try {
        return JSON.stringify(error, (_, value) => (typeof value === "bigint" ? value.toString() : value));
      } catch {
        return "Transaction failed with an unreadable error object.";
      }
    }
    return String(error);
  })();
  if (/user rejected|rejected/i.test(fallback)) return "Transaction rejected in wallet.";
  if (/insufficient/i.test(fallback)) return "Insufficient testnet GEN for stake plus fees.";
  if (/deadline|resolve after/i.test(fallback)) return "This market cannot be resolved until after the deadline.";
  if (/not clearly finished|winner.*0|inconclusive/i.test(fallback)) return "The official page does not clearly show a final result yet.";
  if (/wrong network|chain.?id|chain mismatch|does not match|configured chain/i.test(fallback)) {
    return `Wrong network. Switch MetaMask to the configured GenLayer network (chain ${ACTIVE_NETWORK.chainId}).`;
  }
  return fallback;
}
