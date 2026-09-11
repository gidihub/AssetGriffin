'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <CheckCircle2 size={24} />
        </span>
        <h2 className="text-lg font-bold text-foreground">Thanks — we got it</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          A member of our team will get back to you within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Name</span>
          <input
            required
            type="text"
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Work email</span>
          <input
            required
            type="email"
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Company</span>
        <input
          type="text"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">How can we help?</span>
        <textarea
          required
          rows={4}
          className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <Button type="submit" size="lg" className="h-11 rounded-lg text-sm font-semibold">
        Send message
      </Button>
    </form>
  )
}
