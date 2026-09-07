import { BrainCircuit, Globe2, Scale, ShieldAlert } from "lucide-react";

const sections = [
  {
    icon: Globe2,
    title: "Markets use named public sources",
    text: "Each market stores a source URL and a source label. The resolver reads that page after the deadline instead of trusting a private operator."
  },
  {
    icon: BrainCircuit,
    title: "The contract asks for structured evidence",
    text: "GenLayer renders the page text and asks an LLM to return JSON with winner 1, winner 2, or 0 when the page is inconclusive."
  },
  {
    icon: Scale,
    title: "Validators check the answer",
    text: "The contract uses GenLayer non-deterministic consensus so validators agree on a source-grounded result before state changes."
  },
  {
    icon: ShieldAlert,
    title: "This is a testnet demo",
    text: "Resolve uses testnet GEN only. It is not real-money gambling, investment advice, or a production wagering product."
  }
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-5xl">How Resolve works</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/70">Resolve is a public dApp for curated prediction markets. The owner creates markets, users stake on one of two outcomes, and anyone can trigger resolution after the deadline.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <section className="rounded-md border border-line bg-white p-5 shadow-soft" key={item.title}>
              <Icon className="text-steel" aria-hidden />
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-2 leading-7 text-ink/70">{item.text}</p>
            </section>
          );
        })}
      </div>
    </main>
  );
}
