import type { Metadata } from 'next'
import {
  Search,
  Boxes,
  Laptop,
  PackageSearch,
  ScanLine,
  Hammer,
  Gauge,
  Wrench,
  ClipboardCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { IndexCardGrid, type IndexCardGroup } from '@/components/marketing/index-card-grid'
import { solutions } from '@/lib/solutions-data'

export const metadata: Metadata = {
  title: 'Asset Management Solutions | AssetGriffin',
  description:
    'Explore AssetGriffin solutions for asset tracking, IT asset management, inventory, maintenance, inspections, and audit trail compliance.',
}

const cardMeta: Record<string, { icon: LucideIcon; description: string }> = {
  'asset-tracking': { icon: Search, description: 'Find any asset in seconds, at any scale' },
  'asset-management': { icon: Boxes, description: 'Full lifecycle control across your fleet' },
  'it-asset-management': { icon: Laptop, description: 'Laptops, licenses, and devices in one place' },
  'inventory-management': { icon: PackageSearch, description: 'Stock levels and reorder alerts, live' },
  'fixed-asset-tracking': { icon: ScanLine, description: 'Barcode tagging built for audits' },
  'tool-tracking': { icon: Hammer, description: 'Check tools in and out by crew and site' },
  'equipment-tracking': { icon: Gauge, description: 'Utilization and uptime for heavy gear' },
  'maintenance-management': { icon: Wrench, description: 'Preventive schedules and work orders' },
  'inspection-management': { icon: ClipboardCheck, description: 'Recurring pass/fail checklists' },
  'audit-trail-compliance': { icon: ShieldCheck, description: 'An immutable log of every change' },
}

const groups: IndexCardGroup[] = [
  {
    title: 'By capability',
    cards: solutions
      .filter((solution) => solution.navGroup === 'capability')
      .map((solution) => ({
        href: `/solutions/${solution.slug}`,
        icon: cardMeta[solution.slug].icon,
        title: solution.navLabel,
        description: cardMeta[solution.slug].description,
      })),
  },
  {
    title: 'Explore further',
    cards: solutions
      .filter((solution) => solution.navGroup === 'highlight')
      .map((solution) => ({
        href: `/solutions/${solution.slug}`,
        icon: cardMeta[solution.slug].icon,
        title: solution.navLabel,
        description: cardMeta[solution.slug].description,
      })),
  },
]

export default function SolutionsIndexPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Solutions"
        title="Purpose-built tools for every part of asset management"
        subtitle="From tracking down a single tool to managing a full fleet lifecycle, every AssetGriffin solution is built on the same core platform."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <IndexCardGrid groups={groups} />
        </div>
      </section>
      <CtaBand
        headline="One platform, every capability"
        subcopy="You don't need to choose a plan per solution. Every AssetGriffin account includes tracking, maintenance, inspections, and audit trails from day one."
      />
      <MarketingFooter />
    </main>
  )
}
