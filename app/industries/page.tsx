import type { Metadata } from 'next'
import {
  GraduationCap,
  Landmark,
  Building2,
  Truck,
  Flame,
  ShieldCheck,
  Lock,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Building,
  HeartHandshake,
  Church,
  Hammer,
  Factory,
  Store,
  Laptop,
  Users,
  Zap,
  Hotel,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { IndexCardGrid, type IndexCardGroup } from '@/components/marketing/index-card-grid'
import { industries } from '@/lib/industries-data'
import { subVerticals } from '@/lib/sub-verticals-data'

export const metadata: Metadata = {
  title: 'Asset Tracking Software by Industry | AssetGriffin',
  description:
    'See how AssetGriffin fits construction, schools, healthcare, government, and 15 other industries with mobile scanning, maintenance schedules, and compliance-ready reporting.',
}

const cardMeta: Record<string, { icon: LucideIcon; description: string; group: string }> = {
  'k12-schools': { icon: GraduationCap, description: 'Devices, textbooks, and campus gear', group: 'Education & public' },
  'universities-colleges': {
    icon: Landmark,
    description: 'Assets across departments and campuses',
    group: 'Education & public',
  },
  government: { icon: Building2, description: 'Compliance-ready tracking for agencies', group: 'Education & public' },
  'public-works': { icon: Truck, description: 'Municipal fleets and equipment, tracked', group: 'Education & public' },
  'security-agencies': { icon: Lock, description: 'Checkout by guard, shift, and site', group: 'Education & public' },
  healthcare: { icon: HeartPulse, description: 'Equipment tracking built for compliance', group: 'Healthcare & social' },
  'nonprofits-charities': {
    icon: HeartHandshake,
    description: 'Free tracking, grant-ready reporting',
    group: 'Healthcare & social',
  },
  'churches-religious-organizations': {
    icon: Church,
    description: 'Volunteer-friendly gear checkout',
    group: 'Healthcare & social',
  },
  construction: { icon: Hammer, description: 'Tools and equipment across job sites', group: 'Business & industry' },
  manufacturing: { icon: Factory, description: 'Machinery and production assets', group: 'Business & industry' },
  'small-business': { icon: Store, description: 'Simple tracking that scales with you', group: 'Business & industry' },
  'it-teams': { icon: Laptop, description: 'Hardware lifecycle for growing teams', group: 'Business & industry' },
  'it-consulting-msps': { icon: Users, description: 'Separate inventories, one dashboard', group: 'Business & industry' },
  'energy-utilities': { icon: Zap, description: 'Field equipment and calibration history', group: 'Business & industry' },
  'transportation-logistics': {
    icon: Truck,
    description: 'Fleet, trailers, and cargo equipment',
    group: 'Business & industry',
  },
  hospitality: { icon: Hotel, description: 'Equipment and furnishings by property', group: 'Business & industry' },
  'warehousing-distribution': {
    icon: Warehouse,
    description: 'Material handling equipment on the floor',
    group: 'Business & industry',
  },
}

const groupOrder = ['Education & public', 'Healthcare & social', 'Business & industry']

const groups: IndexCardGroup[] = groupOrder.map((groupTitle) => ({
  title: groupTitle,
  cards: industries
    .filter((industry) => cardMeta[industry.slug]?.group === groupTitle)
    .map((industry) => ({
      href: `/industries/${industry.slug}`,
      icon: cardMeta[industry.slug].icon,
      title: industry.navLabel,
      description: cardMeta[industry.slug].description,
    })),
}))

const subVerticalIcons: Record<string, LucideIcon> = {
  'fire-departments': Flame,
  'police-departments': ShieldCheck,
  biomedical: Stethoscope,
  'pharmaceutical-laboratory': FlaskConical,
  'hospital-facilities': Building,
}

const subVerticalDescriptions: Record<string, string> = {
  'fire-departments': 'PPE, SCBA, and apparatus, inspection-ready',
  'police-departments': 'Chain-of-custody for issued equipment',
  biomedical: 'Calibration history that survives an audit',
  'pharmaceutical-laboratory': 'Custody and calibration across labs',
  'hospital-facilities': 'HVAC, generators, and life-safety systems',
}

const specializedGroup: IndexCardGroup = {
  title: 'Specialized & flagship',
  cards: subVerticals.map((entry) => ({
    href: `/industries/${entry.group}/${entry.slug}`,
    icon: subVerticalIcons[entry.slug] ?? Building2,
    title: entry.navLabel,
    description: subVerticalDescriptions[entry.slug] ?? '',
  })),
}

export default function IndustriesIndexPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="By Industry"
        title="Built for how your industry actually works"
        subtitle="Every industry tracks assets a little differently. Pick yours below to see the workflows, integrations, and reporting built around it."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <IndexCardGrid groups={[specializedGroup, ...groups]} />
        </div>
      </section>
      <CtaBand
        headline="Don't see your industry? AssetGriffin still fits."
        subcopy="The core workflows — scanning, checkouts, maintenance, and audit trails — work for any team tracking physical assets."
      />
      <MarketingFooter />
    </main>
  )
}
