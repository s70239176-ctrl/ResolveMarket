"use client";

import { Check, Circle, Loader2, X } from "lucide-react";
import type { TxStatus } from "@/lib/contract";

const steps: TxStatus[] = ["submitted", "accepted", "finalized"];

export function TxStepper({ status, error, hash }: { status: TxStatus; error?: string; hash?: string }) {
  if (status === "idle" && !error && !hash) return null;
  return (
    <section className="rule-top mt-6 pt-4 text-sm">
      <div className="mono mb-4 text-[10px] text-muted">TRANSACTION STATUS</div>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const active = status === step;
          const done = steps.indexOf(status) >= steps.indexOf(step);
          return (
            <div className="flex items-center gap-2" key={step}>
              {status === "failed" ? <X className="text-red" size={16} aria-hidden /> : active && status !== "finalized" ? <Loader2 className="animate-spin text-red" size={16} aria-hidden /> : done ? <Check size={16} aria-hidden /> : <Circle className="text-muted" size={16} aria-hidden />}
              <span className="mono text-[10px]">{step}</span>
            </div>
          );
        })}
      </div>
      {status === "estimating" ? <p className="mt-4 text-muted">Preparing transaction…</p> : null}
      {hash ? <p className="mono mt-4 break-all text-[10px] text-muted">TX / {hash}</p> : null}
      {error ? <p className="mt-4 border-l-2 border-red bg-redsoft px-3 py-2 text-sm font-bold text-red">{error}</p> : null}
    </section>
  );
}
