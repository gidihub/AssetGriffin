'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
  title?: string
}

export function FaqAccordion({ items, title = 'Frequently asked questions' }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section className="border-b border-border bg-background">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="text-balance text-center text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <div className="mt-10 flex flex-col border-t border-border">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question} className="border-b border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-sm font-bold text-foreground md:text-base">{item.question}</span>
                  <ChevronRight
                    size={20}
                    className={`flex-shrink-0 text-primary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
