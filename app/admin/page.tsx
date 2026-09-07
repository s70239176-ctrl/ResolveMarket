"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Ban } from "lucide-react";
import { TxStepper } from "@/components/TxStepper";
import { useWallet } from "@/components/WalletProvider";
import { CONTRACT_ADDRESS, OWNER_ADDRESS, type Market, type TxStatus } from "@/lib/contract";
import { cancelMarket, createMarket, humanizeError, listMarkets } from "@/lib/genlayer";

const emptyForm = {
  question: "",
  description: "",
  sourceUrl: "",
  sourceName: "",
  yesLabel: "Yes",
  noLabel: "No",
  deadline: ""
};

export default function AdminPage() {
  const wallet = useWallet();
  const [form, setForm] = useState(emptyForm);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState("");
  const isOwner = Boolean(wallet.address && OWNER_ADDRESS && wallet.address.toLowerCase() === OWNER_ADDRESS);

  async function reload() {
    if (CONTRACT_ADDRESS) setMarkets(await listMarkets());
  }

  useEffect(() => {
    reload().catch((err) => setError(humanizeError(err)));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!wallet.address) return;
    setStatus("estimating");
    setError("");
    try {
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);
      await createMarket(wallet.address, [form.question, form.description, form.sourceUrl, form.sourceName, form.yesLabel, form.noLabel, deadline]);
      setStatus("finalized");
      setForm(emptyForm);
      await reload();
    } catch (err) {
      setStatus("failed");
      setError(humanizeError(err));
    }
  }

  async function cancel(id: number) {
    if (!wallet.address) return;
    setStatus("estimating");
    setError("");
    try {
      await cancelMarket(wallet.address, id);
      setStatus("finalized");
      await reload();
    } catch (err) {
      setStatus("failed");
      setError(humanizeError(err));
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-black">Admin</h1>
        <p className="mt-2 text-ink/65">Create curated markets and cancel unresolved markets before resolution.</p>
        {!CONTRACT_ADDRESS ? <div className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">Configure NEXT_PUBLIC_CONTRACT_ADDRESS before using admin actions.</div> : null}
        {OWNER_ADDRESS && wallet.connected && !isOwner ? <div className="mt-6 rounded-md border border-coral bg-coral/10 p-4 text-sm font-bold">Connected wallet is not the configured owner.</div> : null}
        <form className="mt-6 grid gap-4 rounded-md border border-line bg-white p-5 shadow-soft" onSubmit={submit}>
          {[
            ["question", "Question"],
            ["description", "Description"],
            ["sourceUrl", "Source URL"],
            ["sourceName", "Source name"],
            ["yesLabel", "Yes label"],
            ["noLabel", "No label"]
          ].map(([key, label]) => (
            <label className="block text-sm font-bold" key={key}>
              {label}
              <input
                className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 font-normal"
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                required
              />
            </label>
          ))}
          <label className="block text-sm font-bold">
            Deadline
            <input className="focus-ring mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 font-normal" type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} required />
          </label>
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!isOwner || wallet.wrongNetwork || status === "estimating"}>
            <Plus size={18} aria-hidden />
            Create market
          </button>
        </form>
      </section>
      <aside className="space-y-4">
        <TxStepper status={status} error={error} />
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="font-black">Existing markets</h2>
          <div className="mt-4 space-y-3">
            {markets.length === 0 ? <p className="text-sm text-ink/65">No markets yet.</p> : null}
            {markets.map((market) => (
              <div className="rounded-md border border-line p-3" key={market.id}>
                <div className="text-sm font-bold">{market.question}</div>
                <button className="focus-ring mt-3 inline-flex items-center gap-2 rounded-md border border-coral px-3 py-2 text-sm font-bold text-coral disabled:cursor-not-allowed disabled:opacity-50" disabled={!isOwner || market.resolved || market.cancelled} onClick={() => cancel(market.id)}>
                  <Ban size={15} aria-hidden />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
