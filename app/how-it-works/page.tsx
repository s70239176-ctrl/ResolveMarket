const sections = [
  ["A CASE IS OPENED", "An owner defines one public question, two possible positions, a deadline, and the official source that can settle it."],
  ["PEOPLE TAKE POSITIONS", "Participants choose Yes or No and record their GEN position before the case deadline. The case stays open while the future is unresolved."],
  ["THE SOURCE BECOMES EVIDENCE", "After the deadline, the contract renders the stored source page as text. The resolution prompt is grounded in that public page, not private operator data."],
  ["VALIDATORS REACH A VERDICT", "GenLayer consensus checks the structured extraction. A clear result closes the case; an inconclusive source leaves it unresolved." ]
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
      <section className="grid gap-12 border-b border-ink pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24"><div><p className="mono text-xs text-red">THE METHOD / GENLAYER STUDIONET</p><h1 className="display mt-6 text-[clamp(4rem,10vw,9.5rem)] font-black uppercase leading-[0.8]">How does<br />reality become<br /><span className="text-red">a verdict?</span></h1></div><div className="self-end border-t border-ink pt-5"><p className="text-2xl font-black leading-tight">Resolve turns a question into a case, a source into evidence, and consensus into a durable result.</p><p className="mt-6 text-muted">This interface is a procedural record of what the contract actually does. No private oracle. No invented outcome.</p></div></section>
      <section className="grid gap-0 border-b border-ink lg:grid-cols-2">{sections.map(([title, text], index) => <article className="grid grid-cols-[70px_1fr] gap-5 border-b border-black/20 py-10 lg:nth-[odd]:border-r lg:nth-[odd]:pr-10 lg:nth-[even]:pl-10" key={title}><div className="display text-6xl font-black text-red">0{index + 1}</div><div><h2 className="text-2xl font-black uppercase leading-tight">{title}</h2><p className="mt-4 max-w-lg text-lg leading-8 text-muted">{text}</p></div></article>)}</section>
      <section className="grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr]"><p className="mono text-xs text-red">THE PIPELINE</p><div className="border-t border-ink">{["PUBLIC SOURCE", "CONTENT EXTRACTION", "VALIDATOR CONSENSUS", "VERDICT"].map((item, index) => <div className="flex items-center justify-between border-b border-black/20 py-6" key={item}><span className="mono text-xs text-muted">0{index + 1}</span><span className="text-3xl font-black uppercase">{item}</span><span className="text-red">↓</span></div>)}</div></section>
      <section className="border-t border-ink bg-ink px-6 py-12 text-paper md:px-10"><p className="mono text-xs text-red">IMPORTANT</p><p className="mt-5 max-w-3xl text-2xl font-black leading-tight">Resolve uses testnet GEN only. It is not real-money gambling, investment advice, or a promise that every source will produce a verdict.</p></section>
    </main>
  );
}
