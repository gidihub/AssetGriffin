import type { ComparisonRow } from '@/components/marketing/comparison-table'
import type { FaqItem } from '@/components/marketing/faq-accordion'

export interface ComparePage {
  slug: string
  navLabel: string
  competitorName: string
  metaTitle: string
  metaDescription: string
  intro: string
  rows: ComparisonRow[]
  doesWellHeadline: string
  doesWellBody: string
  looksElsewhereHeadline: string
  looksElsewhereBody: string
  pricingCallout: string
  isPlaceholder?: boolean
  faqs: FaqItem[]
}

const TODO = '[TODO: research and fill]'

function todoRows(): ComparisonRow[] {
  return [
    { label: 'Free tier', valueA: 'Up to 250 assets, unlimited users', valueB: TODO },
    { label: 'Pricing model', valueA: 'Asset-based, not per-seat', valueB: TODO },
    { label: 'Search at scale', valueA: 'Built for 10,000+ assets', valueB: TODO },
    { label: 'Mobile experience', valueA: 'Scan via any phone camera, no app lag', valueB: TODO },
    { label: 'Integrations', valueA: 'Connects to accounting, IT, and workflow tools', valueB: TODO },
    { label: 'Maintenance scheduling', valueA: 'Built-in preventive maintenance', valueB: TODO },
    { label: 'Inspection checklists', valueA: 'Recurring, pass/fail checklists', valueB: TODO },
    { label: 'Audit trail', valueA: 'Full immutable activity log', valueB: TODO },
    { label: 'Support', valueA: 'Email support included on every plan', valueB: TODO },
  ]
}

export const compareTargets: ComparePage[] = [
  {
    slug: 'assettiger',
    navLabel: 'AssetGriffin vs AssetTiger',
    competitorName: 'AssetTiger',
    metaTitle: 'AssetGriffin vs AssetTiger (2026 Comparison) — Which Is Right for You?',
    metaDescription:
      'Compare AssetGriffin and AssetTiger on features, pricing, search performance, mobile experience, and integrations. See which fits your team.',
    intro:
      'AssetTiger is a well-known name in asset tracking with a large existing user base and an asset-based pricing model that many teams like. It is worth being precise about one thing up front: what AssetTiger calls a "free" option is a time-limited 30-day trial, not an ongoing free plan. Here is an honest, feature-by-feature comparison based on AssetTiger\u2019s current published pricing and feature pages, plus publicly available user reviews, to help you decide.',
    rows: [
      {
        label: 'Free tier',
        valueA: 'Permanent free plan — up to 250 assets, unlimited users',
        valueB: '30-day trial only — up to 250 assets, capped at 2 users; paid plans start at 500 assets',
      },
      {
        label: 'Pricing model',
        valueA: 'Asset-based, not per-seat',
        valueB: 'Asset-based, not per-seat (unlimited users on paid plans)',
        aWins: false,
      },
      {
        label: 'Search at scale',
        valueA: 'Built for 10,000+ assets',
        valueB: 'Some reviewers report slower performance with large inventories and complex reports',
      },
      {
        label: 'Mobile experience',
        valueA: 'Scan via any phone camera, no app lag',
        valueB: 'Native iOS/Android app; some reviewers report scanning lag and glitches',
      },
      {
        label: 'Integrations',
        valueA: 'Connects to accounting, IT, and workflow tools',
        valueB: 'REST API on paid plans only — no native pre-built connectors listed',
      },
      {
        label: 'Maintenance scheduling',
        valueA: 'Built-in preventive maintenance',
        valueB: 'Recurring PM scheduling with email alerts, included on paid plans',
        aWins: false,
      },
      {
        label: 'Inspection checklists',
        valueA: 'Recurring, pass/fail checklists',
        valueB: 'No dedicated inspection checklist feature listed',
      },
      {
        label: 'Audit trail',
        valueA: 'Full immutable activity log',
        valueB: 'Immutable activity log included on paid plans',
        aWins: false,
      },
      {
        label: 'Support',
        valueA: 'Email support included on every plan',
        valueB: 'Standard email support during the 30-day trial; priority support on paid plans',
      },
    ],
    doesWellHeadline: 'Where AssetTiger does well',
    doesWellBody:
      'To be fair: AssetTiger\u2019s asset-based pricing is genuinely competitive, every paid plan includes unlimited users at no extra cost, and it ships real preventive maintenance scheduling and an immutable activity log rather than stripped-down versions of those features. It also has a long track record and a large existing user base, plus a full REST API for teams with development resources to build custom integrations.',
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody:
      'The most important distinction is that AssetTiger\u2019s free option is a 30-day trial, not a lasting free plan — once it ends, you need a paid subscription (starting at 500 assets) to keep unlimited users or API access. Beyond that, some user reviews describe slower performance with large inventories or complex reports, and occasional lag or glitches during mobile barcode scanning. Its integrations also rely entirely on a self-serve REST API rather than pre-built connectors, which means someone on your team needs to build the integration rather than turning one on.',
    pricingCallout:
      'AssetGriffin\u2019s free plan does not expire: track up to 250 assets with unlimited users for as long as you want. AssetTiger\u2019s comparable offer is a 30-day trial capped at 2 users, after which its paid plans start at 500 assets with unlimited users, a REST API, and priority support.',
    faqs: [
      {
        question: 'Is AssetTiger free?',
        answer:
          'Not on an ongoing basis. AssetTiger offers a 30-day free trial capped at 250 assets and 2 users, not a permanent free plan. Its paid plans start at 500 assets and include unlimited users.',
      },
      {
        question: 'Does AssetTiger have inspection checklists?',
        answer:
          'Based on AssetTiger\u2019s published feature pages, it does not currently list a dedicated recurring, pass/fail inspection checklist feature, though it does offer physical audit and reconciliation tools alongside preventive maintenance scheduling.',
      },
      {
        question: 'Does AssetTiger have an audit trail?',
        answer:
          'Yes. AssetTiger advertises an immutable activity log as part of its paid-plan permission settings, comparable to AssetGriffin\u2019s audit trail, which is included on every plan including the free one.',
      },
      {
        question: 'Why do some teams switch from AssetTiger to AssetGriffin?',
        answer:
          'Teams most often cite the 30-day limit on AssetTiger\u2019s free trial, some reported performance lag with large inventories or mobile scanning, and having to build integrations themselves against a REST API rather than turning on a pre-built connector.',
      },
    ],
  },
  {
    slug: 'asset-panda',
    navLabel: 'AssetGriffin vs Asset Panda',
    competitorName: 'Asset Panda',
    metaTitle: 'AssetGriffin vs Asset Panda (2026 Comparison) — Which Is Right for You?',
    metaDescription: 'A feature-by-feature comparison of AssetGriffin and Asset Panda. Full research pending.',
    intro: TODO + ' — this page is a placeholder shell pending verified research on Asset Panda\u2019s current pricing and feature set.',
    rows: todoRows(),
    doesWellHeadline: 'Where Asset Panda does well',
    doesWellBody: TODO,
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody: TODO,
    pricingCallout: TODO,
    isPlaceholder: true,
    faqs: [{ question: 'How does AssetGriffin compare to Asset Panda?', answer: TODO }],
  },
  {
    slug: 'ezofficeinventory',
    navLabel: 'AssetGriffin vs EZOfficeInventory',
    competitorName: 'EZOfficeInventory',
    metaTitle: 'AssetGriffin vs EZOfficeInventory (2026 Comparison) — Which Is Right for You?',
    metaDescription: 'A feature-by-feature comparison of AssetGriffin and EZOfficeInventory. Full research pending.',
    intro: TODO + ' — this page is a placeholder shell pending verified research on EZOfficeInventory\u2019s current pricing and feature set.',
    rows: todoRows(),
    doesWellHeadline: 'Where EZOfficeInventory does well',
    doesWellBody: TODO,
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody: TODO,
    pricingCallout: TODO,
    isPlaceholder: true,
    faqs: [{ question: 'How does AssetGriffin compare to EZOfficeInventory?', answer: TODO }],
  },
  {
    slug: 'reftab',
    navLabel: 'AssetGriffin vs Reftab',
    competitorName: 'Reftab',
    metaTitle: 'AssetGriffin vs Reftab (2026 Comparison) — Which Is Right for You?',
    metaDescription: 'A feature-by-feature comparison of AssetGriffin and Reftab. Full research pending.',
    intro: TODO + ' — this page is a placeholder shell pending verified research on Reftab\u2019s current pricing and feature set.',
    rows: todoRows(),
    doesWellHeadline: 'Where Reftab does well',
    doesWellBody: TODO,
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody: TODO,
    pricingCallout: TODO,
    isPlaceholder: true,
    faqs: [{ question: 'How does AssetGriffin compare to Reftab?', answer: TODO }],
  },
  {
    slug: 'snipe-it',
    navLabel: 'AssetGriffin vs Snipe-IT',
    competitorName: 'Snipe-IT',
    metaTitle: 'AssetGriffin vs Snipe-IT (2026 Comparison) — Which Is Right for You?',
    metaDescription: 'A feature-by-feature comparison of AssetGriffin and Snipe-IT. Full research pending.',
    intro: TODO + ' — this page is a placeholder shell pending verified research on Snipe-IT\u2019s current pricing and feature set.',
    rows: todoRows(),
    doesWellHeadline: 'Where Snipe-IT does well',
    doesWellBody: TODO,
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody: TODO,
    pricingCallout: TODO,
    isPlaceholder: true,
    faqs: [{ question: 'How does AssetGriffin compare to Snipe-IT?', answer: TODO }],
  },
  {
    slug: 'sortly',
    navLabel: 'AssetGriffin vs Sortly',
    competitorName: 'Sortly',
    metaTitle: 'AssetGriffin vs Sortly (2026 Comparison) — Which Is Right for You?',
    metaDescription: 'A feature-by-feature comparison of AssetGriffin and Sortly. Full research pending.',
    intro: TODO + ' — this page is a placeholder shell pending verified research on Sortly\u2019s current pricing and feature set.',
    rows: todoRows(),
    doesWellHeadline: 'Where Sortly does well',
    doesWellBody: TODO,
    looksElsewhereHeadline: 'Where teams look elsewhere',
    looksElsewhereBody: TODO,
    pricingCallout: TODO,
    isPlaceholder: true,
    faqs: [{ question: 'How does AssetGriffin compare to Sortly?', answer: TODO }],
  },
]

export function getCompareBySlug(slug: string): ComparePage | undefined {
  return compareTargets.find((target) => target.slug === slug)
}
