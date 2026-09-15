import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { blogPosts } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Blog | AssetGriffin',
  description: 'Practical guides on asset tracking, maintenance, and audits from the AssetGriffin team.',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogIndexPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Blog"
        title="The AssetGriffin blog"
        subtitle="Practical, no-fluff writing on asset tracking, maintenance, and audits — from the team building the software."
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">{post.category}</span>
                <h2 className="text-lg leading-snug text-foreground text-balance">{post.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(post.date)} · {post.readTimeMinutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    Read
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        headline="Ready to put this into practice?"
        subcopy="AssetGriffin handles the tracking, maintenance, and audit workflows this blog talks about — free to start."
      />
      <MarketingFooter />
    </main>
  )
}
