"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Droplets, Github, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import type { Market } from "@/lib/contract";
import { contractExplorerUrl, ACTIVE_NETWORK } from "@/lib/networks";
import { listMarkets, humanizeError } from "@/lib/genlayer";

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    listMarkets()
      .then(setMarkets)
      .catch((err) => setError(humanizeError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <section className="border-b border-line bg-[linear-gradient(135deg,#f8f7f3_0%,#dff1e8_45%,#f8dfd8_100%)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-16">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-steel">Resolve on GenLayer</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Bet on a real event. The chain reads the official page and pays the winner.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">Curated testnet prediction markets resolved by Intelligent Contracts, public webpages, and validator-reviewed LLM extraction.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#markets" className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-white">
                View markets <ArrowRight size={18} aria-hidden />
              </Link>
              {ACTIVE_NETWORK.faucetUrl ? (
                <a href={ACTIVE_NETWORK.faucetUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink px-4 py-3 font-bold">
                  Get testnet GEN <Droplets size={18} aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
          <div className="self-end rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-mint" aria-hidden />
              <div>
                <div className="font-black">Testnet GEN only</div>
                <div className="text-sm text-ink/65">Not real-money gambling.</div>
              </div>
            </div>
            <ol className="mt-5 grid gap-3 text-sm text-ink/75">
              <li>1. Connect MetaMask on {ACTIVE_NETWORK.label}.</li>
              <li>2. Stake Yes or No before the market deadline.</li>
              <li>3. Anyone resolves after deadline; winners claim pro-rata.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" id="markets">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Markets</h2>
            <p className="mt-1 text-ink/65">Owner-curated, source-linked, and resolved onchain.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {CONTRACT_ADDRESS && contractExplorerUrl(CONTRACT_ADDRESS) ? (
              <a href={contractExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" className="focus-ring rounded-md border border-line px-3 py-2 font-bold">
                Contract
              </a>
            ) : null}
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 font-bold">
              GitHub <Github size={16} aria-hidden />
            </a>
          </div>
        </div>
        {!CONTRACT_ADDRESS ? (
          <div className="rounded-md border border-line bg-white p-6 shadow-soft">
            <h3 className="font-black">Contract not configured yet</h3>
            <p className="mt-2 text-ink/65">Set NEXT_PUBLIC_CONTRACT_ADDRESS after deploying the Intelligent Contract. The site is ready to render markets as soon as that env var is present.</p>
          </div>
        ) : loading ? (
          <p className="text-ink/65">Loading markets...</p>
        ) : error ? (
          <p className="text-coral">{error}</p>
        ) : markets.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-6 shadow-soft">No markets yet. The owner can seed one from Admin.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{markets.map((market) => <MarketCard key={market.id} market={market} />)}</div>
        )}
      </section>

      <footer className="border-t border-line px-4 py-8 text-center text-sm text-ink/60">
        Resolve runs on {ACTIVE_NETWORK.label}. Testnet GEN only. Not real-money gambling.
      </footer>
    </main>
  );
}
