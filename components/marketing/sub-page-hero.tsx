interface SubPageHeroProps {
  eyebrow: string
  title: string
  subtitle: string
}

export function SubPageHero({ eyebrow, title, subtitle }: SubPageHeroProps) {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  )
}
