import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { FaqAccordion } from '@/components/marketing/faq-accordion'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | AssetGriffin',
  description:
    'Answers to common questions about AssetGriffin pricing, setup, mobile scanning, integrations, and switching from another asset tracking tool.',
}

const faqs = [
  {
    question: 'Is AssetGriffin really free to start?',
    answer:
      'Yes. You can track up to 250 assets with unlimited users at no cost. There is no trial period or credit card required to get started.',
  },
  {
    question: 'Do we need to buy scanning hardware?',
    answer:
      'No. AssetGriffin uses the camera on any phone your team already has to scan asset tags, so there is no dedicated barcode scanner to purchase.',
  },
  {
    question: 'Can we import our existing spreadsheet?',
    answer:
      'Yes. Bulk import brings your current inventory in as a single pass, so you are not entering every asset by hand.',
  },
  {
    question: 'How is AssetGriffin priced as we grow?',
    answer:
      'Pricing is based on the number of assets you track, not the number of users. You can add as many team members as you need without extra per-seat charges.',
  },
  {
    question: 'Does AssetGriffin support maintenance and inspection scheduling?',
    answer:
      'Yes. You can schedule preventive maintenance and recurring inspections on any asset, with failed inspections automatically opening a maintenance task.',
  },
  {
    question: 'Can we restrict who sees or edits certain assets?',
    answer:
      'Yes. Role-based permissions let you control which team members can view, edit, or check out specific assets or asset categories.',
  },
  {
    question: 'What if we are switching from another asset tracking tool?',
    answer:
      'Most teams import their existing data from a spreadsheet export and are set up within a day. See our side-by-side comparisons with other tools for details on what changes when you switch.',
  },
]

export default function FaqPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Support · FAQ"
        title="Frequently asked questions"
        subtitle="Common questions about pricing, setup, and how AssetGriffin works. Have something else on your mind? Reach out on our contact page."
      />
      <FaqAccordion items={faqs} title="Questions and answers" />
      <MarketingFooter />
    </main>
  )
}
