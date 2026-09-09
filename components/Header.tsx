"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Wallet } from "lucide-react";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "@/lib/time";
import { ACTIVE_NETWORK } from "@/lib/networks";
import { formatGEN } from "@/lib/genlayer";

export function Header() {
  const wallet = useWallet();
  const [connectError, setConnectError] = useState("");

  async function handleConnect() {
    setConnectError("");
    try {
      await wallet.connect();
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <header className="rule-bottom bg-paper">
      <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-6 px-5 md:px-10">
        <Link href="/" className="display text-2xl font-black uppercase tracking-[-0.08em]">
          Resolve<span className="text-red">.</span>
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.16em] md:flex">
          <Link className="hover:text-red" href="/">Cases</Link>
          <Link className="hover:text-red" href="/activity">Activity</Link>
          <Link className="hover:text-red" href="/how-it-works">How it works</Link>
          <Link className="hover:text-red" href="/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="mono hidden text-[10px] text-muted lg:inline-flex"><span className="red-marker mr-2 h-[6px] w-[6px]" />{ACTIVE_NETWORK.name}</span>
          {wallet.wrongNetwork ? (
            <button className="focus-ring border border-red bg-red px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white" onClick={wallet.switchNetwork}>Switch network</button>
          ) : wallet.connected ? (
            <button className="focus-ring inline-flex items-center gap-2 border border-ink bg-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white" onClick={wallet.disconnect}>
              <span>{formatGEN(wallet.balance ?? 0n)}</span><span className="h-3 w-px bg-white/40" />{truncateAddress(wallet.address)}<ChevronDown size={13} aria-hidden />
            </button>
          ) : (
            <button className="focus-ring inline-flex items-center gap-2 border border-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] hover:bg-ink hover:text-white" onClick={handleConnect}>
              <Wallet size={14} aria-hidden />Connect wallet
            </button>
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between border-t border-black/10 px-5 py-2 md:hidden">
        <span className="mono text-[10px] text-muted"><span className="red-marker h-[6px] w-[6px]" />{ACTIVE_NETWORK.name}</span>
        <Link href="/activity" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em]">Menu <ArrowUpRight size={13} /></Link>
      </div>
      {connectError ? <p className="mx-auto max-w-[1600px] border-t border-red bg-redsoft px-5 py-2 text-xs font-bold text-red md:px-10">{connectError}</p> : null}
    </header>
  );
}
