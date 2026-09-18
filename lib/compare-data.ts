import type { ComparisonRow } from '@/components/marketing/comparison-table'
import type { FaqItem } from '@/components/marketing/faq-accordion'

export const COMPARE_LAST_VERIFIED = 'September 17, 2026'

export interface ComparePage {
  slug: string
  navLabel: string
  cardSubtitle: string
  competitorName: string
  comparisonCompetitorLabel?: string
  extraColumnHeader?: string
  metaTitle: string
  metaDescription: string
  intro: string
  rows: ComparisonRow[]
  doesWellHeadline: string
  doesWellBody: string
  looksElsewhereHeadline: string
  looksElsewhereBody: string
  unverifiedBody?: string
  pricingCallout?: string
  lastVerified: string
  finalCtaLabel: string
  isPlaceholder?: boolean
  faqs: FaqItem[]
}

export const compareCardSubtitles: Record<string, string> = {}

export const compareTargets: ComparePage[] = [
  {
    slug: 'assettiger',
    navLabel: 'AssetGriffin vs AssetTiger',
    cardSubtitle: 'Free tier limits and search at scale',
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
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — your free plan does not expire',
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
    cardSubtitle: 'Configurable data model, quote-based pricing',
    competitorName: 'Asset Panda',
    metaTitle: 'AssetGriffin vs Asset Panda (2026 Comparison)',
    metaDescription:
      'Compare AssetGriffin and Asset Panda on pricing transparency, configurability, and integrations — with sourced, verified information.',
    intro:
      'Asset Panda is a well-established, highly configurable asset tracking platform built around collections, categories, and custom attributes — used by organizations that need to model many different kinds of assets in one system. Here\u2019s an honest comparison based on publicly verifiable information.',
    rows: [
      {
        label: 'Pricing transparency',
        valueA: 'Fully public, self-serve',
        valueB: 'Quote-based per one industry source',
      },
      {
        label: 'Pricing model',
        valueA: 'Asset-based, unlimited users',
        valueB: 'Asset-based, unlimited users (per vendor site)',
        aWins: false,
      },
      {
        label: 'Free tier',
        valueA: 'Yes, 250 assets',
        valueB: 'Not verified from a primary source',
      },
      {
        label: 'Custom fields',
        valueA: 'Yes',
        valueB: 'Yes — collections/categories/attributes',
        aWins: false,
      },
      {
        label: 'Mobile scanning',
        valueA: 'Phone camera, no hardware',
        valueB: 'QR/barcode via mobile app',
        aWins: false,
      },
      {
        label: 'Offline mode',
        valueA: '—',
        valueB: 'Yes, for audits/inspections',
        aWins: false,
      },
      {
        label: 'Integrations',
        valueA: 'Growing list, Zapier planned',
        valueB: 'Broad — Slack, Teams, Jamf, Intune, Jira, and more',
        aWins: false,
      },
    ],
    doesWellHeadline: 'Where Asset Panda does well',
    doesWellBody:
      'Asset Panda\u2019s configurable data model is genuinely flexible — collections, categories, and custom attributes let organizations shape the system around their own asset types rather than a fixed schema. Its mobile app supports QR/barcode scanning, transfers, and inspections directly from the field, including an offline mode for audits and inspections in locations without reliable connectivity. Its integration list is broad, with documented connections to Slack, Microsoft Teams, Zendesk, ServiceNow, Jamf Pro, Microsoft Intune, Kandji, Jira, and Google Workspace.',
    looksElsewhereHeadline: 'Where pricing gets harder to evaluate',
    looksElsewhereBody:
      'Asset Panda\u2019s exact plan pricing is not clearly published on its own site as of this writing — one independent industry overview describes the model as annual-subscription, quote-based pricing rather than a simple public tier table. This makes it difficult to compare costs directly without contacting sales, which is a meaningful difference from a fully transparent, self-serve pricing page.',
    unverifiedBody:
      'A permanent free plan, current review-pattern complaints/praise from the last 12 months, and current employee or customer counts — none of these could be confirmed from primary sources at time of research, so we\u2019re not making claims about them either way.',
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — see your pricing upfront, no sales call required',
    faqs: [],
  },
  {
    slug: 'ezofficeinventory',
    navLabel: 'AssetGriffin vs EZOfficeInventory',
    cardSubtitle: 'Item-scaled pricing with enterprise add-ons',
    competitorName: 'EZOfficeInventory',
    metaTitle: 'AssetGriffin vs EZOfficeInventory (2026 Comparison)',
    metaDescription:
      'Compare AssetGriffin and EZOfficeInventory on pricing structure, features, and what\u2019s included at each tier — sourced and verified.',
    intro:
      'EZOfficeInventory (EZO) is a mid-market asset tracking platform with tiered plans that scale by the number of items tracked. Here\u2019s a factual look at how it compares.',
    rows: [
      {
        label: 'Pricing',
        valueA: 'Flat, published per tier',
        valueB: 'Scales with item count, varies by volume',
      },
      {
        label: 'Free tier',
        valueA: 'Yes, 250 assets',
        valueB: '14-day trial only (no confirmed free tier)',
      },
      {
        label: 'Starting point',
        valueA: '250 assets free',
        valueB: '100 items minimum on paid plans',
      },
      {
        label: 'AI features',
        valueA: 'GriffinEye (photo/text extraction, natural-language search)',
        valueB: '"AI-powered tools" referenced at Premium, undefined',
      },
      {
        label: 'Inspection checklists',
        valueA: 'Yes, built-in',
        valueB: 'Not verified as a distinct feature',
      },
      {
        label: 'Custom fields',
        valueA: 'Yes',
        valueB: 'Yes, from Advanced tier up',
        aWins: false,
      },
    ],
    doesWellHeadline: 'Where EZO does well',
    doesWellBody:
      'EZO\u2019s four-tier structure (Essentials, Advanced, Premium, Custom Enterprise) is publicly priced, with unlimited users under fair-use terms starting at 100 tracked items. Premium-level plans reference AI-powered tools, though the specific capabilities aren\u2019t detailed on the pricing page itself. Higher tiers add SSO, custom integrations, and API access.',
    looksElsewhereHeadline: 'Where it gets more complex',
    looksElsewhereBody:
      'Pricing scales with item volume in a way that isn\u2019t a flat per-tier number — a 300-item selection shows three different visible price points ($63.55, $85.51, $100.88/month) across paid tiers, meaning the actual cost depends on your specific asset count rather than a single published figure per plan. Enterprise pricing is custom/contact-sales only.',
    unverifiedBody:
      'A permanent free tier (only a 14-day trial is confirmed), a defined preventive-maintenance workflow beyond a referenced CMMS add-on, a distinct inspection-checklist feature, or per-asset audit trail depth.',
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — know your exact price before you commit',
    faqs: [],
  },
  {
    slug: 'reftab',
    navLabel: 'AssetGriffin vs Reftab',
    cardSubtitle: 'Hardware tracking plus SaaS-management hybrid',
    competitorName: 'Reftab',
    metaTitle: 'AssetGriffin vs Reftab (2026 Comparison)',
    metaDescription:
      'Compare AssetGriffin and Reftab on pricing, maintenance features, and what each tool is actually built for — sourced and verified.',
    intro:
      'Reftab combines hardware asset tracking with SaaS/software license management in one platform. It\u2019s worth understanding this dual focus before comparing directly, since it\u2019s solving a slightly broader problem than pure asset tracking.',
    rows: [
      {
        label: 'Pricing model',
        valueA: 'Single asset-based price',
        valueB: 'Hardware tiers + separate per-user SaaS pricing',
      },
      {
        label: 'Entry price',
        valueA: 'Free, 250 assets',
        valueB: '~$31.25/mo (Standard), reported free tier unconfirmed',
      },
      {
        label: 'Maintenance',
        valueA: 'Preventive scheduling built in',
        valueB: 'Work orders, e-signatures, mobile technician workflows',
        aWins: false,
      },
      {
        label: 'Inspections',
        valueA: 'Built-in checklists',
        valueB: 'Customizable forms support inspection use cases',
        aWins: false,
      },
      {
        label: 'Identity/SSO',
        valueA: 'Planned',
        valueB: 'Okta, Microsoft Entra, SSO/provisioning already supported',
        aWins: false,
      },
      {
        label: 'Scope',
        valueA: 'Pure asset tracking',
        valueB: 'Hardware + SaaS/software license management',
        aWins: false,
      },
    ],
    doesWellHeadline: 'Where Reftab does well',
    doesWellBody:
      'Reftab publishes clear tier pricing (Standard $31.25/mo, Pro $62.50/mo, Business $125/mo, billed annually) plus a separate $0.75/software-user/year charge for its SaaS-management features. It has genuinely developed maintenance functionality — work orders, mobile technician workflows, e-signatures, and customizable forms for repairs, calibration, and safety inspections. Its integration list includes Microsoft Intune, Okta, Microsoft Entra, and SSO/provisioning support, which is a stronger enterprise-identity story than most competitors in this comparison set.',
    looksElsewhereHeadline: 'Where the model differs from ours',
    looksElsewhereBody:
      'Reftab\u2019s pricing structure has two separate pricing dimensions — flat hardware tiers plus per-user software-license pricing — which is more to track than a single asset-based number. A free-forever tier for up to 50 assets is reported by a third-party source but wasn\u2019t independently confirmed on Reftab\u2019s own current pricing page.',
    unverifiedBody:
      'A defined AI feature, the complete audit-log event schema/retention period, and a sourced 12-month review-pattern synthesis.',
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — one price, no separate software-license billing to track',
    faqs: [],
  },
  {
    slug: 'snipe-it',
    navLabel: 'AssetGriffin vs Snipe-IT',
    cardSubtitle: 'Self-hosted control vs. hosted simplicity',
    competitorName: 'Snipe-IT',
    comparisonCompetitorLabel: 'Snipe-IT (self-hosted)',
    extraColumnHeader: 'Snipe-IT (hosted)',
    metaTitle: 'AssetGriffin vs Snipe-IT (2026 Comparison)',
    metaDescription:
      'Compare AssetGriffin\u2019s hosted, zero-setup platform against Snipe-IT\u2019s self-hosted open-source model — sourced and verified.',
    intro:
      'Snipe-IT is a genuinely different kind of comparison than the others on this page — it\u2019s open-source software you can self-host for free, or pay for as a hosted cloud service. The real decision isn\u2019t features, it\u2019s who you want managing the infrastructure.',
    rows: [
      {
        label: 'Setup',
        valueA: 'Zero setup, hosted',
        valueB: 'You install/maintain it yourself',
        valueC: 'Managed for you, at a price',
      },
      {
        label: 'Cost',
        valueA: 'Free up to 250 assets',
        valueB: 'Free (infrastructure cost is yours)',
        valueC: '$39.99+/mo',
      },
      {
        label: 'Technical burden',
        valueA: 'None',
        valueB: 'Significant — your responsibility',
        valueC: 'Removed, like ours',
        aWins: false,
      },
      {
        label: 'AI features',
        valueA: 'GriffinEye',
        valueB: 'Not verified',
        valueC: 'Not verified',
      },
      {
        label: 'Support',
        valueA: 'Included',
        valueB: 'Community-based',
        valueC: 'Included (per hosted plan)',
        aWins: false,
      },
    ],
    doesWellHeadline: 'Where Snipe-IT does well',
    doesWellBody:
      'The self-hosted edition is free, open-source, with no user or asset cap — a real option for technically capable teams who want full control and zero subscription cost. Its hosted plans (Basic $39.99/mo, Small Business $99.99/mo, Dedicated $249.99/mo) include automated backups, updates, SSL encryption, and support, removing the self-hosting burden for a price. Activity tracking — asset assignments, status changes, check-ins/check-outs with timestamp and user attribution — is documented.',
    looksElsewhereHeadline: 'The real tradeoff',
    looksElsewhereBody:
      'Self-hosting means your organization is responsible for installing, updating, backing up, securing, and maintaining the software yourself — a genuine technical and operational commitment, not a "set it and forget it" tool. This is fundamentally different from a hosted SaaS product where that responsibility isn\u2019t yours at all.',
    unverifiedBody:
      'Maintenance scheduling, inspection checklists, or any AI capability — none of these could be confirmed from primary Snipe-IT sources at time of research.',
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — no server to set up, no updates to manage yourself',
    faqs: [],
  },
  {
    slug: 'sortly',
    navLabel: 'AssetGriffin vs Sortly',
    cardSubtitle: 'Simple inventory UX with tiered item limits',
    competitorName: 'Sortly',
    metaTitle: 'AssetGriffin vs Sortly (2026 Comparison)',
    metaDescription:
      'Compare AssetGriffin and Sortly on pricing tiers, custom field limits, and feature depth — sourced and verified.',
    intro:
      'Sortly is a visual, photo-first inventory tracking tool with a genuinely accessible free tier. It\u2019s a good comparison for teams deciding between simple visual inventory tracking and a fuller asset-management feature set.',
    rows: [
      {
        label: 'Free tier',
        valueA: '250 assets, unlimited users, unlimited custom fields',
        valueB: '100 items, 1 user, 1 custom field',
      },
      {
        label: 'Pricing model',
        valueA: 'Pure asset-based',
        valueB: 'Hybrid — item count + user licenses',
      },
      {
        label: 'Custom fields (entry tier)',
        valueA: 'Unlimited',
        valueB: '1 (free) up to unlimited (Premium)',
      },
      {
        label: 'Maintenance scheduling',
        valueA: 'Built in',
        valueB: 'Not verified',
      },
      {
        label: 'Inspection checklists',
        valueA: 'Built in',
        valueB: 'Not verified',
      },
      {
        label: 'Integrations',
        valueA: 'Growing list',
        valueB: 'QuickBooks Online, Slack, Amazon Business',
        aWins: false,
      },
    ],
    doesWellHeadline: 'Where Sortly does well',
    doesWellBody:
      'Sortly\u2019s free plan is real and usable — 100 items, one user license, one custom field — with a clear upgrade path (Advanced $24/mo, Ultra $74/mo, Premium $149/mo per one pricing source, annual billing). Custom field limits scale cleanly by tier (1, 5, 10, 20, unlimited), and its integrations include QuickBooks Online, Slack, and Amazon Business.',
    looksElsewhereHeadline: 'Where the tiering gets restrictive',
    looksElsewhereBody:
      'Sortly\u2019s free and lower tiers cap both item count and custom fields fairly tightly — a G2 pricing summary notes reviewers specifically flag reporting and custom-field restrictions on lower tiers. Its pricing model blends item capacity and user licenses together, so it\u2019s not a pure asset-based model — both dimensions can push you into a higher tier.',
    unverifiedBody:
      'Preventive maintenance scheduling, a distinct inspection-checklist feature, and any AI capability — none of these appear in Sortly\u2019s current retrieved official materials.',
    lastVerified: COMPARE_LAST_VERIFIED,
    finalCtaLabel: 'Start free — unlimited custom fields from day one, no per-field upgrade path',
    faqs: [],
  },
]

for (const target of compareTargets) {
  compareCardSubtitles[target.slug] = target.cardSubtitle
}

export function getCompareBySlug(slug: string): ComparePage | undefined {
  return compareTargets.find((target) => target.slug === slug)
}
