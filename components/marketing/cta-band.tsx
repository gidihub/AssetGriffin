import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CtaBandProps {
  headline: string
  subcopy?: string
  ctaLabel?: string
  ctaHref?: string
}

export function CtaBand({
  headline,
  subcopy,
  ctaLabel = 'Start free — import your assets in minutes',
  ctaHref = '/app',
}: CtaBandProps) {
  return (
    <section className="border-b border-border bg-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center md:py-20">
        <h2 className="max-w-2xl text-balance text-2xl tracking-tight text-background md:text-3xl">
          {headline}
        </h2>
        {subcopy && <p className="max-w-xl text-pretty text-sm leading-relaxed text-background/70">{subcopy}</p>}
        <Button
          render={<Link href={ctaHref} />}
          nativeButton={false}
          size="lg"
          className="h-12 rounded-lg px-6 text-[15px] font-medium"
        >
          {ctaLabel} <ArrowUpRight size={18} />
        </Button>
      </div>
    </section>
  )
}
