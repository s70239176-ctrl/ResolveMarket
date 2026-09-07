"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { formatGEN } from "@/lib/genlayer";
import type { Market } from "@/lib/contract";
import { deadlineLabel, timeLeft } from "@/lib/time";

export function MarketCard({ market }: { market: Market }) {
  const total = market.yes_pool + market.no_pool;
  const status = market.cancelled ? "Cancelled" : market.resolved ? `Resolved: ${market.winner === 1 ? market.yes_label : market.no_label}` : timeLeft(market.deadline);

  return (
    <article className="rounded-md border border-line bg-white p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-ink/55">
        <span>{market.source_name}</span>
        <span>{status}</span>
      </div>
      <h2 className="text-lg font-black leading-snug">{market.question}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-mint/12 p-3">
          <div className="font-bold">{market.yes_label}</div>
          <div className="text-ink/65">{formatGEN(market.yes_pool)}</div>
        </div>
        <div className="rounded-md bg-coral/12 p-3">
          <div className="font-bold">{market.no_label}</div>
          <div className="text-ink/65">{formatGEN(market.no_pool)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/65">
        <span>{deadlineLabel(market.deadline)}</span>
        <span>{formatGEN(total)} pooled</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white" href={`/markets/${market.id}`}>
          Open <ArrowRight size={16} aria-hidden />
        </Link>
        <a className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-bold" href={market.source_url} target="_blank" rel="noreferrer">
          Source <ExternalLink size={16} aria-hidden />
        </a>
      </div>
    </article>
  );
}
