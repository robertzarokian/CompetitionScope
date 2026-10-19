export function SectionHeading({
  label,
  title,
  body,
  className = "",
}: {
  label: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">
        {label}
      </p>
      <h2 className="font-display text-2xl font-semibold leading-tight text-navy-800 sm:text-3xl">
        {title}
      </h2>
      {body && (
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-navy-500">{body}</p>
      )}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-10 pt-4 sm:px-10">
      <span className="inline-flex items-center border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
        {eyebrow}
      </span>
      <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-navy-800 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-500 sm:text-[17px]">
        {intro}
      </p>
    </section>
  );
}
