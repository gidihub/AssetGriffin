import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { CtaBand } from '@/components/marketing/cta-band'
import { blogPosts, getBlogPost } from '@/lib/blog-data'

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | AssetGriffin Blog`,
    description: post.excerpt,
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  return (
    <main>
      <MarketingHeader />

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={15} />
            Back to blog
          </Link>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{post.category}</p>
          <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {formatDate(post.date)} · {post.readTimeMinutes} min read
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <div className="flex flex-col gap-12">
            {post.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{section.heading}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{section.body}</p>
              </div>
            ))}
          </div>

          {related.length > 0 && (
            <div className="mt-16 border-t border-border pt-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Related reading</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="text-sm font-semibold text-foreground text-pretty">{r.title}</span>
                    <ArrowRight size={16} className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <CtaBand
        headline="Ready to put this into practice?"
        subcopy="AssetGriffin handles the tracking, maintenance, and audit workflows this post talks about — free to start."
      />
      <MarketingFooter />
    </main>
  )
}
