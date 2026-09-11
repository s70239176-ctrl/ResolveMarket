export type Address = `0x${string}`;

export type MarketSide = 1 | 2;
export type Winner = 0 | 1 | 2;

export type Market = {
  id: number;
  question: string;
  description?: string;
  source_url: string;
  backup_source_url: string;
  source_name: string;
  yes_label: string;
  no_label: string;
  deadline: number;
  yes_pool: bigint;
  no_pool: bigint;
  resolved: boolean;
  winner: Winner;
  resolution_status?: "pending" | "resolved" | "undetermined" | string;
  resolution_excerpt?: string;
  cancelled: boolean;
};

export type Stake = {
  yes: bigint;
  no: bigint;
};

export type TxStatus = "idle" | "estimating" | "submitted" | "accepted" | "finalized" | "failed";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address | undefined;
export const OWNER_ADDRESS = process.env.NEXT_PUBLIC_OWNER_ADDRESS?.toLowerCase();

export function normalizeMarket(raw: any): Market {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    id: Number(value.id),
    question: String(value.question ?? ""),
    description: value.description ? String(value.description) : "",
    source_url: String(value.source_url ?? ""),
    backup_source_url: String(value.backup_source_url ?? ""),
    source_name: String(value.source_name ?? ""),
    yes_label: String(value.yes_label ?? "Yes"),
    no_label: String(value.no_label ?? "No"),
    deadline: Number(value.deadline ?? 0),
    yes_pool: BigInt(value.yes_pool ?? 0),
    no_pool: BigInt(value.no_pool ?? 0),
    resolved: Boolean(value.resolved),
    winner: Number(value.winner ?? 0) as Winner,
    resolution_status: String(value.resolution_status ?? (value.resolved ? "resolved" : "pending")),
    resolution_excerpt: value.resolution_excerpt ? String(value.resolution_excerpt) : "",
    cancelled: Boolean(value.cancelled)
  };
}

export function normalizeStake(raw: any): Stake {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    yes: BigInt(value?.yes ?? 0),
    no: BigInt(value?.no ?? 0)
  };
}
