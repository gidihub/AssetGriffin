interface LegalSection {
  heading: string
  body: string[]
  list?: string[]
}

interface LegalContentProps {
  lastUpdated: string
  sections: LegalSection[]
}

export function LegalContent({ lastUpdated, sections }: LegalContentProps) {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <nav aria-label="Section navigation" className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">On this page</p>
          <ol className="mt-3 flex flex-col gap-2">
            {sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  href={`#${slugify(section.heading)}`}
                  className="text-sm text-foreground/80 hover:text-primary"
                >
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-10">
          {sections.map((section) => (
            <div key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
              <h2 className="text-xl tracking-tight text-foreground">{section.heading}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.body.map((paragraph, index) => (
                  <p key={index} className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-3 flex flex-col gap-2 pl-1">
                  {section.list.map((item, index) => (
                    <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
