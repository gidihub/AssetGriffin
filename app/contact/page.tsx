import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { ContactForm } from '@/components/marketing/contact-form'

export const metadata: Metadata = {
  title: 'Contact AssetGriffin',
  description: 'Get in touch with the AssetGriffin team for sales, support, or general questions.',
}

export default function ContactPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Company · Contact"
        title="Talk to the AssetGriffin team"
        subtitle="Questions about pricing, migrating from another tool, or enterprise needs? Send us a note and we'll get back to you within one business day."
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 md:grid-cols-[1fr_1.4fr] md:py-20">
          <div className="flex flex-col gap-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Email us</p>
                <p className="mt-1 text-sm text-muted-foreground">hello@assetgriffin.com</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Sales & enterprise</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tracking more than 25,000 assets, or need SSO and custom onboarding? Mention it in your message and
                  we&apos;ll route you to our enterprise team.
                </p>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
