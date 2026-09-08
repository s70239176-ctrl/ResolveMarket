"use client";

import Link from "next/link";
import { LogOut, PlugZap, Wallet } from "lucide-react";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "@/lib/time";
import { ACTIVE_NETWORK } from "@/lib/networks";
import { formatGEN } from "@/lib/genlayer";

export function Header() {
  const wallet = useWallet();

  return (
    <header className="border-b border-line bg-paper/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-black tracking-normal">
          Resolve
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-ink/70">
          <Link className="hover:text-ink" href="/activity">
            Activity
          </Link>
          <Link className="hover:text-ink" href="/how-it-works">
            How it works
          </Link>
          <Link className="hover:text-ink" href="/admin">
            Admin
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          {wallet.wrongNetwork ? (
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-coral px-3 py-2 text-sm font-bold text-white"
              onClick={wallet.switchNetwork}
            >
              <PlugZap size={16} aria-hidden />
              Switch to {ACTIVE_NETWORK.name}
            </button>
          ) : null}
          {wallet.connected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-line px-3 py-2 text-sm font-bold">
                {wallet.balance === undefined ? "GEN --" : formatGEN(wallet.balance)}
              </span>
              <button
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-bold"
                onClick={wallet.disconnect}
              >
                <LogOut size={16} aria-hidden />
                {truncateAddress(wallet.address)}
              </button>
            </div>
          ) : (
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white"
              onClick={wallet.connect}
            >
              <Wallet size={16} aria-hidden />
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
