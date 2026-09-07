"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { TxStatus } from "@/lib/contract";

const steps: TxStatus[] = ["submitted", "accepted", "finalized"];

export function TxStepper({ status, error, hash }: { status: TxStatus; error?: string; hash?: string }) {
  if (status === "idle" && !error && !hash) return null;
  return (
    <div className="rounded-md border border-line bg-white p-4 text-sm shadow-soft">
      <div className="mb-3 font-bold">Transaction</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step) => {
          const active = status === step;
          const done = steps.indexOf(status) >= steps.indexOf(step);
          return (
            <div className="flex items-center gap-2" key={step}>
              {status === "failed" ? (
                <XCircle className="text-coral" size={18} aria-hidden />
              ) : active && status !== "finalized" ? (
                <Loader2 className="animate-spin text-steel" size={18} aria-hidden />
              ) : done ? (
                <CheckCircle2 className="text-mint" size={18} aria-hidden />
              ) : (
                <Circle className="text-ink/30" size={18} aria-hidden />
              )}
              <span className="capitalize">{step}</span>
            </div>
          );
        })}
      </div>
      {status === "estimating" ? <p className="mt-3 text-ink/60">Estimating GenLayer fees...</p> : null}
      {hash ? <p className="mt-3 break-all text-ink/60">Tx: {hash}</p> : null}
      {error ? <p className="mt-3 text-coral">{error}</p> : null}
    </div>
  );
}
