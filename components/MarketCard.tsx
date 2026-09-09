"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatGEN } from "@/lib/genlayer";
import type { Market } from "@/lib/contract";
import { deadlineLabel, timeLeft } from "@/lib/time";

export function MarketCard({ market }: { market: Market }) {
  const total = market.yes_pool + market.no_pool;
  const closed = market.resolved || market.cancelled;
  const status = market.cancelled ? "CANCELLED" : market.resolved ? "CLOSED" : "OPEN";
  const yesShare = total > 0n ? Number((market.yes_pool * 1000n) / total) / 10 : 50;
  const noShare = Math.max(0, 100 - yesShare);

  return (
    <article className="group rule-bottom grid gap-5 py-6 md:grid-cols-[100px_minmax(0,1fr)_150px_150px_40px] md:items-center md:gap-6">
      <div className="mono text-xs text-muted">CASE {String(market.id).padStart(5, "0")}</div>
      <div className="min-w-0">
        <div className="mono mb-3 flex items-center text-[10px] text-muted"><span className={closed ? "mr-2 h-2 w-2 bg-ink" : "red-marker"} />{status} / {market.source_name}</div>
        <h2 className="max-w-2xl text-xl font-black leading-tight md:text-2xl">{market.question}</h2>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">
          <span>Deadline {deadlineLabel(market.deadline)}</span>
          {!closed ? <span>{timeLeft(market.deadline)}</span> : null}
        </div>
      </div>
      <div>
        <div className="mono text-[10px] text-muted">POSITION SPLIT</div>
        <div className="mt-2 flex h-2 w-full bg-black/10"><span className="bg-ink" style={{ width: `${yesShare}%` }} /><span className="bg-red" style={{ width: `${noShare}%` }} /></div>
        <div className="mt-2 flex justify-between text-xs font-bold"><span>YES {yesShare.toFixed(1)}%</span><span>NO {noShare.toFixed(1)}%</span></div>
      </div>
      <div className="text-left md:text-right">
        <div className="mono text-[10px] text-muted">TOTAL STAKED</div>
        <div className="mt-1 text-lg font-black">{formatGEN(total)}</div>
      </div>
      <Link aria-label={`Open case ${market.id}`} className="focus-ring inline-flex h-10 w-10 items-center justify-center border border-ink group-hover:bg-red group-hover:text-white" href={`/markets/${market.id}`}>
        <ArrowUpRight size={18} aria-hidden />
      </Link>
    </article>
  );
}
