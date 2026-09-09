"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { CONTRACT_ADDRESS, type Market } from "@/lib/contract";
import { ACTIVE_NETWORK, contractExplorerUrl } from "@/lib/networks";
import { listMarkets, humanizeError } from "@/lib/genlayer";

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS));
  const [error, setError] = useState("");
  const openMarkets = useMemo(() => markets.filter((market) => !market.resolved && !market.cancelled), [markets]);
  const closedMarkets = useMemo(() => markets.filter((market) => market.resolved || market.cancelled), [markets]);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    listMarkets().then(setMarkets).catch((err) => setError(humanizeError(err))).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1600px] grid-cols-1 items-end gap-10 px-5 pb-14 pt-16 md:px-10 md:pb-20 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mono mb-7 text-xs text-red"><span className="red-marker" />PUBLIC QUESTIONS / PUBLIC SOURCES / ONCHAIN VERDICTS</p>
          <h1 className="display max-w-5xl text-[clamp(4rem,10vw,9.5rem)] font-black uppercase leading-[0.82]">The market<br />can argue.<br /><span className="text-red">The verdict</span><br />cannot.</h1>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link href="#cases" className="focus-ring inline-flex items-center gap-3 bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-red">View open cases <ArrowRight size={17} /></Link>
            <p className="max-w-xs text-sm leading-6 text-muted">Prediction markets resolved from public evidence through GenLayer.</p>
          </div>
        </div>
        <div className="rule-top self-end pt-5">
          <div className="mono text-[10px] text-muted">SYSTEM NOTE / 001</div>
          <p className="mt-4 max-w-md text-xl font-bold leading-tight">When the deadline passes, the source becomes evidence.</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-black/20 pt-4">
            <div><div className="mono text-[10px] text-muted">OPEN CASES</div><div className="mt-2 text-4xl font-black">{String(openMarkets.length).padStart(3, "0")}</div></div>
            <div><div className="mono text-[10px] text-muted">AWAITING VERDICT</div><div className="mt-2 text-4xl font-black">{String(openMarkets.length).padStart(3, "0")}</div></div>
            <div><div className="mono text-[10px] text-muted">CLOSED</div><div className="mt-2 text-4xl font-black">{String(closedMarkets.length).padStart(3, "0")}</div></div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink bg-ink px-5 py-4 text-paper md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <span className="mono text-[10px]">{ACTIVE_NETWORK.label} / TESTNET GEN ONLY / NOT REAL-MONEY GAMBLING</span>
          <span className="mono text-[10px] text-red">QUESTION → CASE → EVIDENCE → VERDICT</span>
        </div>
      </section>

      <section id="cases" className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mono text-xs text-red">CASE REGISTRY / LIVE</p><h2 className="display mt-3 text-6xl font-black uppercase leading-none md:text-8xl">Open cases</h2></div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.12em]">
            {CONTRACT_ADDRESS && contractExplorerUrl(CONTRACT_ADDRESS) ? <a className="inline-flex items-center gap-1 hover:text-red" href={contractExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">Contract <ExternalLink size={13} /></a> : null}
            <Link className="inline-flex items-center gap-1 hover:text-red" href="/how-it-works">How it works <ArrowRight size={13} /></Link>
          </div>
        </div>
        <div className="rule-top">
          {!CONTRACT_ADDRESS ? <p className="py-10 text-muted">Set the deployed contract address to open the case registry.</p> : loading ? <p className="py-10 text-muted">Reading case registry…</p> : error ? <p className="border-l-2 border-red bg-redsoft px-4 py-3 text-red">{error}</p> : markets.length === 0 ? <div className="py-10"><div className="display text-5xl font-black uppercase">No open cases.</div><p className="mt-3 text-muted">Reality is temporarily undecided.</p></div> : markets.map((market) => <MarketCard key={market.id} market={market} />)}
        </div>
      </section>

      <section className="border-t border-ink bg-surface px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="mono text-xs text-red">THE PROCEDURE</p><h2 className="display mt-4 text-6xl font-black uppercase leading-[0.88] md:text-8xl">How reality becomes a verdict.</h2></div>
          <div className="grid gap-0 border-t border-ink">
            {["A case is opened", "People take positions", "The source becomes evidence", "Validators reach a verdict"].map((title, index) => <div className="grid grid-cols-[58px_1fr_24px] items-center border-b border-black/20 py-5" key={title}><span className="mono text-xs text-red">0{index + 1}</span><span className="text-xl font-black uppercase">{title}</span><ArrowDownRight size={18} /></div>)}
            <Link href="/how-it-works" className="mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] hover:text-red">Read the method <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink bg-ink px-5 py-10 text-paper md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-8"><div><div className="display text-4xl font-black uppercase">Resolve<span className="text-red">.</span></div><p className="mono mt-3 text-[10px] text-paper/60">PUBLIC QUESTIONS / PUBLIC SOURCES / ONCHAIN VERDICTS</p></div><div className="mono text-right text-[10px] text-paper/60">{ACTIVE_NETWORK.label}<br />TESTNET GEN ONLY</div></div>
      </footer>
    </main>
  );
}
