import { Quote } from 'lucide-react'

export function TestimonialPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Quote size={18} />
      </span>
      <p className="text-sm font-semibold text-foreground">Customer testimonials coming soon</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        We&apos;re collecting feedback from teams who&apos;ve switched. Check back here for real quotes from real
        customers.
      </p>
    </div>
  )
}
