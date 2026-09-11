"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Ban, Plus } from "lucide-react";
import { TxStepper } from "@/components/TxStepper";
import { useWallet } from "@/components/WalletProvider";
import { CONTRACT_ADDRESS, OWNER_ADDRESS, type Market, type TxStatus } from "@/lib/contract";
import { cancelMarket, createMarket, humanizeError, listMarkets } from "@/lib/genlayer";

const emptyForm = { question: "", description: "", sourceUrl: "", backupSourceUrl: "", sourceName: "", yesLabel: "Yes", noLabel: "No", deadline: "" };

export default function AdminPage() {
  const wallet = useWallet();
  const [form, setForm] = useState(emptyForm);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState("");
  const isOwner = Boolean(wallet.address && OWNER_ADDRESS && wallet.address.toLowerCase() === OWNER_ADDRESS);

  async function reload() { if (CONTRACT_ADDRESS) setMarkets(await listMarkets()); }
  useEffect(() => { reload().catch((err) => setError(humanizeError(err))); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!wallet.address) return; setStatus("estimating"); setError("");
    try { const deadline = Math.floor(new Date(form.deadline).getTime() / 1000); await createMarket(wallet.address, [form.question, form.description, form.sourceUrl, form.backupSourceUrl, form.sourceName, form.yesLabel, form.noLabel, deadline]); setStatus("finalized"); setForm(emptyForm); await reload(); }
    catch (err) { setStatus("failed"); setError(humanizeError(err)); }
  }
  async function cancel(id: number) { if (!wallet.address) return; setStatus("estimating"); setError(""); try { await cancelMarket(wallet.address, id); setStatus("finalized"); await reload(); } catch (err) { setStatus("failed"); setError(humanizeError(err)); } }

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
      <div className="border-b border-ink pb-8"><p className="mono text-xs text-red">OWNER ACCESS / CASE REGISTRY</p><h1 className="display mt-4 text-[clamp(4rem,9vw,9rem)] font-black uppercase leading-[0.8]">Control<br />desk.</h1><p className="mt-8 max-w-xl text-lg leading-7 text-muted">Open a curated question, anchor it to evidence, and set the moment when the case can be resolved.</p></div>
      {!CONTRACT_ADDRESS ? <p className="my-8 border-l-2 border-red bg-redsoft px-4 py-3 text-red">Configure the deployed contract address before using the control desk.</p> : null}
      {OWNER_ADDRESS && wallet.connected && !isOwner ? <p className="my-8 border-l-2 border-red bg-redsoft px-4 py-3 text-red">Connected wallet is not the configured owner.</p> : null}
      <div className="grid gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="border-t border-ink" onSubmit={submit}><div className="border-b border-ink py-5"><span className="mono text-xs text-red">01 / CASE INFORMATION</span></div>{[["question", "Question"], ["description", "Description"], ["sourceUrl", "Primary evidence URL"], ["backupSourceUrl", "Backup evidence URL"], ["sourceName", "Source name"], ["yesLabel", "Yes label"], ["noLabel", "No label"]].map(([key, label]) => <label className="block border-b border-black/20 py-4" key={key}><span className="mono text-[10px] text-muted">{label}</span><input className="focus-ring mt-2 block w-full border-0 border-b border-black/30 bg-transparent px-0 py-2 text-lg font-bold outline-none focus:border-red" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required /></label>)}<label className="block border-b border-black/20 py-4"><span className="mono text-[10px] text-muted">Deadline</span><input className="focus-ring mt-2 block w-full border-0 border-b border-black/30 bg-transparent px-0 py-2 text-lg font-bold outline-none focus:border-red" type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} required /></label><button className="focus-ring mt-8 inline-flex items-center gap-2 bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-red disabled:cursor-not-allowed disabled:opacity-40" disabled={!isOwner || wallet.wrongNetwork || status === "estimating"}><Plus size={16} />Create case</button></form>
        <aside><TxStepper status={status} error={error} /><div className="border-t border-ink pt-5"><p className="mono text-xs text-red">CASE REGISTRY</p>{markets.length === 0 ? <p className="py-8 text-muted">No cases registered.</p> : <div className="mt-5">{markets.map((market) => <div className="border-b border-black/20 py-5" key={market.id}><div className="mono text-[10px] text-muted">CASE {String(market.id).padStart(5, "0")}</div><div className="mt-2 text-lg font-black">{market.question}</div><div className="mt-4 flex items-center justify-between gap-3"><a className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] hover:text-red" href={`/markets/${market.id}`}>Open <ArrowUpRight size={13} /></a><button className="focus-ring inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-red disabled:cursor-not-allowed disabled:text-muted" disabled={!isOwner || market.resolved || market.cancelled} onClick={() => cancel(market.id)}><Ban size={13} />Cancel</button></div></div>)}</div>}</div></aside>
      </div>
    </main>
  );
}
