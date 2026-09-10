"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { TxStepper } from "@/components/TxStepper";
import { useWallet } from "@/components/WalletProvider";
import type { Market, MarketSide, Stake, TxStatus } from "@/lib/contract";
import { claimMarket, formatGEN, getClaimable, getMarket, getStake, getWithdrawable, humanizeError, parseGEN, resolveMarket, stakeMarket, withdraw } from "@/lib/genlayer";
import { deadlineLabel, timeLeft } from "@/lib/time";
import { txExplorerUrl } from "@/lib/networks";

export default function MarketDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const wallet = useWallet();
  const [market, setMarket] = useState<Market>();
  const [stake, setStake] = useState<Stake>({ yes: 0n, no: 0n });
  const [claimable, setClaimable] = useState(0n);
  const [withdrawable, setWithdrawable] = useState(0n);
  const [amount, setAmount] = useState("1");
  const [side, setSide] = useState<MarketSide>(1);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const next = await getMarket(id);
    setMarket(next);
    if (wallet.address) {
      setStake(await getStake(id, wallet.address));
      setClaimable(await getClaimable(id, wallet.address));
      setWithdrawable(await getWithdrawable(wallet.address));
    }
  }, [id, wallet.address]);

  useEffect(() => { load().catch((err) => setError(humanizeError(err))); }, [load]);

  async function runWrite(action: () => Promise<{ hash: string }>) {
    setError(""); setStatus("estimating"); setHash("");
    try {
      const tx = await action();
      setHash(tx.hash); setStatus("finalized");
      try {
        // Studio can briefly serve the previous accepted state after a
        // resolution receipt. Poll a few times so the verdict becomes visible.
        for (let attempt = 0; attempt < 5; attempt += 1) {
          await load();
          if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (refreshError) { setError(`Transaction finalized, but refresh failed: ${humanizeError(refreshError)}`); }
    } catch (err) { setStatus("failed"); setError(humanizeError(err)); }
  }


  function handleStake() {
    if (!wallet.address) return setError("Connect your wallet before taking a position.");
    const value = parseGEN(amount);
    if (value <= 0n) return setError("Enter an amount greater than 0 GEN.");
    if (wallet.balance !== undefined && value > wallet.balance) return setError("Your wallet does not have enough GEN for this position.");
    void runWrite(() => stakeMarket(wallet.address!, id, side, value));
  }

  if (!market) return <main className="mx-auto max-w-[1600px] px-5 py-20 md:px-10"><p className="mono text-xs text-muted">READING CASE FILE…</p></main>;
  const closed = Math.floor(Date.now() / 1000) >= market.deadline;
  const disabled = !wallet.connected || wallet.wrongNetwork || status === "estimating" || status === "submitted";
  const total = market.yes_pool + market.no_pool;
  const yesShare = total > 0n ? Number((market.yes_pool * 1000n) / total) / 10 : 50;
  const noShare = Math.max(0, 100 - yesShare);

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-5">
        <div><p className="mono text-xs text-red">CASE {String(id).padStart(5, "0")}</p><p className="mono mt-2 text-[10px] text-muted">{market.cancelled ? "CANCELLED" : market.resolved ? "CLOSED / VERDICT RECORDED" : "OPEN / AWAITING VERDICT"}</p></div>
        <div className="mono text-right text-[10px] text-muted">{market.source_name}<br />{deadlineLabel(market.deadline)}</div>
      </div>

      <section className="grid gap-12 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div><p className="mono text-xs text-muted">THE QUESTION</p><h1 className="display mt-6 max-w-5xl text-[clamp(3.5rem,7vw,8rem)] font-black uppercase leading-[0.86]">{market.question}</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-muted">{market.description}</p><a className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] hover:text-red" href={market.source_url} target="_blank" rel="noreferrer">Evidence source <ArrowUpRight size={16} /></a></div>
        <div className="self-end border-t border-ink pt-5"><p className="mono text-xs text-muted">POSITION SPLIT</p><div className="mt-5 flex h-4 w-full bg-black/10"><span className="bg-ink" style={{ width: `${yesShare}%` }} /><span className="bg-red" style={{ width: `${noShare}%` }} /></div><div className="mt-4 grid grid-cols-2 gap-4"><div><div className="mono text-[10px] text-muted">{market.yes_label}</div><div className="mt-1 text-4xl font-black">{yesShare.toFixed(1)}%</div><div className="mt-1 text-sm text-muted">{formatGEN(market.yes_pool)}</div></div><div><div className="mono text-[10px] text-muted">{market.no_label}</div><div className="mt-1 text-4xl font-black">{noShare.toFixed(1)}%</div><div className="mt-1 text-sm text-muted">{formatGEN(market.no_pool)}</div></div></div></div>
      </section>

      <section className="grid gap-10 border-t border-ink py-10 lg:grid-cols-[1fr_1fr]">
        <div><p className="mono text-xs text-red">YOUR POSITION</p><div className="mt-5 grid grid-cols-2 border-y border-ink"><button className={`focus-ring border-r border-ink p-5 text-left ${side === 1 ? "bg-ink text-white" : "hover:bg-black/5"}`} onClick={() => setSide(1)}><span className="mono text-[10px]">YES / {market.yes_label}</span><span className="mt-4 block text-3xl font-black">{formatGEN(stake.yes)}</span>{side === 1 ? <span className="mt-4 block text-xs font-bold text-red">SELECTED</span> : null}</button><button className={`focus-ring p-5 text-left ${side === 2 ? "bg-ink text-white" : "hover:bg-black/5"}`} onClick={() => setSide(2)}><span className="mono text-[10px]">NO / {market.no_label}</span><span className="mt-4 block text-3xl font-black">{formatGEN(stake.no)}</span>{side === 2 ? <span className="mt-4 block text-xs font-bold text-red">SELECTED</span> : null}</button></div><label className="mono mt-7 block text-[10px] text-muted" htmlFor="amount">AMOUNT / GEN<input id="amount" className="focus-ring mt-2 block w-full border-b-2 border-ink bg-transparent px-0 py-3 text-3xl font-black outline-none" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label><p className="mono mt-3 text-[10px] text-muted">BALANCE / {formatGEN(wallet.balance ?? 0n)}</p><button className="focus-ring mt-7 w-full bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-red disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled || closed || market.resolved || market.cancelled} onClick={handleStake}>Take {side === 1 ? "Yes" : "No"} position <span aria-hidden>→</span></button><p className="mono mt-4 text-[10px] text-muted">TESTNET GEN / NOT REAL-MONEY GAMBLING</p></div>
        <div className="border-t border-ink pt-5 lg:border-l lg:border-t-0 lg:pl-10"><p className="mono text-xs text-red">THE EVIDENCE</p><div className="mt-6 border-y border-ink"><div className="flex justify-between py-4"><span className="mono text-[10px] text-muted">SOURCE 01</span><span className="mono text-[10px] text-muted">AVAILABLE</span></div><a className="block border-t border-black/20 py-5 text-xl font-black hover:text-red" href={market.source_url} target="_blank" rel="noreferrer">{market.source_name} <ArrowUpRight className="inline" size={18} /></a><div className="border-t border-black/20 py-5"><div className="mono text-[10px] text-muted">RESOLUTION METHOD</div><div className="mt-5 grid gap-3 text-sm font-bold"><span>PUBLIC SOURCE</span><span className="text-red">↓ CONTENT EXTRACTION</span><span className="text-red">↓ VALIDATOR CONSENSUS</span><span>↓ VERDICT</span></div></div></div><div className="mt-8"><div className="mono text-[10px] text-muted">DEADLINE</div><div className="mt-2 text-xl font-black">{closed ? "DEADLINE REACHED" : timeLeft(market.deadline)}</div></div></div>
      </section>

      {market.resolved || market.cancelled ? <section aria-live="polite" className="border-y border-ink bg-ink px-5 py-10 text-paper md:px-8 md:py-14"><p className="mono text-xs text-red">VERDICT REACHED / CASE CLOSED</p><div className="display mt-5 text-[clamp(5rem,15vw,14rem)] font-black uppercase leading-[0.75]">{market.cancelled ? "VOID" : market.winner === 1 ? market.yes_label : market.no_label}</div><p className="mono mt-8 text-xs text-paper/60">{market.cancelled ? "No position wins. Principal remains claimable according to the contract." : `The recorded outcome is ${market.winner === 1 ? market.yes_label : market.no_label}.`}</p>{market.resolution_excerpt ? <p className="mt-8 max-w-2xl border-l-2 border-red pl-4 text-lg text-paper/70">“{market.resolution_excerpt}”</p> : null}</section> : null}

      <section className="grid gap-10 border-t border-ink py-10 lg:grid-cols-[1fr_1fr]"><div><p className="mono text-xs text-red">SETTLEMENT</p><h2 className="display mt-4 text-5xl font-black uppercase leading-none">Credit and withdraw your result.</h2>{market.resolved ? <p className="mt-6 border-l-2 border-red pl-4 text-lg font-black">The verdict is recorded: {market.winner === 1 ? market.yes_label : market.no_label}.</p> : market.cancelled ? <p className="mt-6 border-l-2 border-red pl-4 text-lg font-black">This case was cancelled and marked void.</p> : null}</div><div><button className="focus-ring flex w-full items-center justify-between border-b border-ink py-5 text-left text-lg font-black hover:text-red disabled:cursor-not-allowed disabled:text-muted" disabled={disabled || claimable === 0n} onClick={() => wallet.address && runWrite(() => claimMarket(wallet.address!, id))}>Credit claim <span>{formatGEN(claimable)} <ArrowUpRight className="inline" size={18} /></span></button><button className="focus-ring flex w-full items-center justify-between border-b border-ink py-5 text-left text-lg font-black hover:text-red disabled:cursor-not-allowed disabled:text-muted" disabled={disabled || withdrawable === 0n} onClick={() => wallet.address && runWrite(() => withdraw(wallet.address!))}>Withdraw <span>{formatGEN(withdrawable)} <ArrowUpRight className="inline" size={18} /></span></button><button className="focus-ring mt-8 inline-flex items-center gap-2 border border-ink px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] hover:bg-ink hover:text-white" disabled={disabled || !closed || market.resolved || market.cancelled} onClick={() => wallet.address && runWrite(() => resolveMarket(wallet.address!, id))}><RotateCw size={15} /> Request resolution</button><TxStepper status={status} error={error} hash={txExplorerUrl(hash) ?? hash} /></div></section>
    </main>
  );
}
