"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RotateCw, Trophy, WalletCards } from "lucide-react";
import { TxStepper } from "@/components/TxStepper";
import { useWallet } from "@/components/WalletProvider";
import type { Market, MarketSide, Stake, TxStatus } from "@/lib/contract";
import { claimMarket, formatGEN, getClaimable, getMarket, getStake, getWithdrawable, humanizeError, parseGEN, resolveMarket, stakeMarket, withdraw } from "@/lib/genlayer";
import { deadlineLabel, timeLeft } from "@/lib/time";
import { txExplorerUrl } from "@/lib/networks";

export default function MarketDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const wallet = useWallet();
  const [market, setMarket] = useState<Market | undefined>();
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

  useEffect(() => {
    load().catch((err) => setError(humanizeError(err)));
  }, [load]);

  async function runWrite(action: () => Promise<{ hash: string }>) {
    setError("");
    setStatus("estimating");
    setHash("");
    try {
      const tx = await action();
      setHash(tx.hash);
      setStatus("finalized");
      await load();
    } catch (err) {
      setStatus("failed");
      setError(humanizeError(err));
    }
  }

  if (!market) {
    return <main className="mx-auto max-w-5xl px-4 py-10">Loading market...</main>;
  }

  const closed = Math.floor(Date.now() / 1000) >= market.deadline;
  const disabled = !wallet.connected || wallet.wrongNetwork || status === "estimating" || status === "submitted";

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-ink/60">
          <span>{market.source_name}</span>
          <span>•</span>
          <span>{deadlineLabel(market.deadline)}</span>
          <span>•</span>
          <span>{timeLeft(market.deadline)}</span>
        </div>
        <h1 className="text-3xl font-black leading-tight md:text-5xl">{market.question}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/70">{market.description}</p>
        <a href={market.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-steel">
          Official source <ExternalLink size={16} aria-hidden />
        </a>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="text-sm text-ink/60">Yes pool</div>
            <div className="mt-1 text-2xl font-black">{formatGEN(market.yes_pool)}</div>
            <div className="mt-2 font-bold text-mint">{market.yes_label}</div>
          </div>
          <div className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="text-sm text-ink/60">No pool</div>
            <div className="mt-1 text-2xl font-black">{formatGEN(market.no_pool)}</div>
            <div className="mt-2 font-bold text-coral">{market.no_label}</div>
          </div>
        </div>

        {market.resolved || market.cancelled ? (
          <div className="mt-6 rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 font-black">
              <Trophy size={18} aria-hidden />
              {market.cancelled ? "Cancelled" : `Winner: ${market.winner === 1 ? market.yes_label : market.no_label}`}
            </div>
            {market.resolution_excerpt ? <p className="mt-3 text-ink/70">"{market.resolution_excerpt}"</p> : null}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="font-black">Stake</h2>
          <p className="mt-1 text-sm text-ink/60">Testnet GEN only. Not real-money gambling.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className={`focus-ring rounded-md border px-3 py-2 font-bold ${side === 1 ? "border-mint bg-mint/15" : "border-line"}`} onClick={() => setSide(1)}>
              {market.yes_label}
            </button>
            <button className={`focus-ring rounded-md border px-3 py-2 font-bold ${side === 2 ? "border-coral bg-coral/15" : "border-line"}`} onClick={() => setSide(2)}>
              {market.no_label}
            </button>
          </div>
          <label className="mt-4 block text-sm font-bold" htmlFor="amount">
            Amount
          </label>
          <input id="amount" className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <button
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || closed || market.resolved || market.cancelled}
            onClick={() => wallet.address && runWrite(() => stakeMarket(wallet.address!, id, side, parseGEN(amount)))}
          >
            <WalletCards size={18} aria-hidden />
            Stake
          </button>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/65">
            <span>Your yes: {formatGEN(stake.yes)}</span>
            <span>Your no: {formatGEN(stake.no)}</span>
          </div>
        </div>

        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="font-black">Resolve and claim</h2>
          <button
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || !closed || market.resolved || market.cancelled}
            onClick={() => wallet.address && runWrite(() => resolveMarket(wallet.address!, id))}
          >
            <RotateCw size={18} aria-hidden />
            Resolve
          </button>
          <button
            className="focus-ring mt-3 w-full rounded-md bg-mint px-4 py-3 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || claimable === 0n}
            onClick={() => wallet.address && runWrite(() => claimMarket(wallet.address!, id))}
          >
            Credit claim {formatGEN(claimable)}
          </button>
          <button
            className="focus-ring mt-3 w-full rounded-md bg-steel px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || withdrawable === 0n}
            onClick={() => wallet.address && runWrite(() => withdraw(wallet.address!))}
          >
            Withdraw {formatGEN(withdrawable)}
          </button>
        </div>
        <TxStepper status={status} error={error} hash={txExplorerUrl(hash) ?? hash} />
      </aside>
    </main>
  );
}
