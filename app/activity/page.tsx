"use client";

import { useEffect, useState } from "react";
import { MarketCard } from "@/components/MarketCard";
import { useWallet } from "@/components/WalletProvider";
import { CONTRACT_ADDRESS, type Market } from "@/lib/contract";
import { getStake, humanizeError, listMarkets } from "@/lib/genlayer";

export default function ActivityPage() {
  const wallet = useWallet();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wallet.address || !CONTRACT_ADDRESS) return;
    setLoading(true);
    listMarkets()
      .then(async (all) => {
        const withStake: Market[] = [];
        for (const market of all) {
          const stake = await getStake(market.id, wallet.address!);
          if (stake.yes > 0n || stake.no > 0n) withStake.push(market);
        }
        setMarkets(withStake);
      })
      .catch((err) => setError(humanizeError(err)))
      .finally(() => setLoading(false));
  }, [wallet.address]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Your activity</h1>
      <p className="mt-2 text-ink/65">Markets where the connected wallet has staked testnet GEN.</p>
      {!wallet.connected ? (
        <div className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">Connect MetaMask to see your positions.</div>
      ) : !CONTRACT_ADDRESS ? (
        <div className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">Contract address is not configured yet.</div>
      ) : loading ? (
        <p className="mt-6 text-ink/65">Loading positions...</p>
      ) : error ? (
        <p className="mt-6 text-coral">{error}</p>
      ) : markets.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">No positions for this wallet yet.</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">{markets.map((market) => <MarketCard key={market.id} market={market} />)}</div>
      )}
    </main>
  );
}
