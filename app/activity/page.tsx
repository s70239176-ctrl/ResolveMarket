"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { CONTRACT_ADDRESS, type Market, type Stake } from "@/lib/contract";
import { getStake, humanizeError, listMarkets } from "@/lib/genlayer";
import { formatGEN } from "@/lib/genlayer";

type Position = { market: Market; stake: Stake };

export default function ActivityPage() {
  const wallet = useWallet();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wallet.address || !CONTRACT_ADDRESS) return;
    setLoading(true);
    listMarkets().then(async (all) => {
      const next: Position[] = [];
      for (const market of all) { const stake = await getStake(market.id, wallet.address!); if (stake.yes > 0n || stake.no > 0n) next.push({ market, stake }); }
      setPositions(next);
    }).catch((err) => setError(humanizeError(err))).finally(() => setLoading(false));
  }, [wallet.address]);

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
      <div className="border-b border-ink pb-8"><p className="mono text-xs text-red">PERSONAL RECORD / WALLET ACTIVITY</p><h1 className="display mt-4 text-[clamp(4rem,9vw,9rem)] font-black uppercase leading-[0.8]">Your<br />positions.</h1><p className="mt-8 max-w-xl text-lg leading-7 text-muted">Every position is a record of where you stood before the evidence arrived.</p></div>
      {!wallet.connected ? <div className="py-16"><p className="mono text-xs text-muted">ACCESS REQUIRED</p><div className="display mt-4 text-5xl font-black uppercase">Connect your wallet to review your cases.</div></div> : !CONTRACT_ADDRESS ? <div className="py-16 text-muted">Contract address is not configured.</div> : loading ? <p className="py-16 text-muted">Reading position ledger…</p> : error ? <p className="my-10 border-l-2 border-red bg-redsoft px-4 py-3 text-red">{error}</p> : positions.length === 0 ? <div className="py-16"><p className="mono text-xs text-muted">NO RECORDS</p><div className="display mt-4 text-5xl font-black uppercase">No open positions.</div><p className="mt-3 text-muted">Reality is temporarily undecided.</p></div> : <div className="rule-top mt-8">{positions.map(({ market, stake }) => <Link className="group grid gap-4 border-b border-black/20 py-6 md:grid-cols-[120px_minmax(0,1fr)_180px_180px_24px] md:items-center" href={`/markets/${market.id}`} key={market.id}><span className="mono text-xs text-muted">CASE {String(market.id).padStart(5, "0")}</span><span><span className="block text-lg font-black">{market.question}</span><span className="mono mt-2 block text-[10px] text-muted">{market.resolved ? "CLOSED" : "OPEN"}</span></span><span><span className="mono block text-[10px] text-muted">POSITION</span><span className="font-black">{stake.yes > 0n ? market.yes_label : market.no_label}</span></span><span><span className="mono block text-[10px] text-muted">STAKE</span><span className="font-black">{formatGEN(stake.yes + stake.no)}</span></span><ArrowUpRight className="group-hover:text-red" size={18} /></Link>)}</div>}
    </main>
  );
}
