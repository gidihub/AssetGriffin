'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
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
  Layers,
  GraduationCap,
  Landmark,
  Building2,
  Truck,
  Flame,
  Lock,
  HeartPulse,
  HeartHandshake,
  Church,
  Factory,
  Store,
  Users,
  Zap,
  Hotel,
  Warehouse,
  ArrowLeftRight,
  Calculator,
  Tag,
  BookOpen,
  Newspaper,
  TrendingUp,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compareTargets } from '@/lib/compare-data'

interface NavItem {
  label: string
  href?: string
  description?: string
  icon?: LucideIcon
}

interface NavColumn {
  title: string
  items: NavItem[]
}

interface NavMenu {
  key: MenuKey
  label: string
  title: string
  subtitle: string
  columns: NavColumn[]
}

const solutionsColumns: NavColumn[] = [
  {
    title: 'By capability',
    items: [
      {
        label: 'Asset Tracking Software',
        href: '/solutions/asset-tracking',
        description: 'Find any asset in seconds, at any scale',
        icon: Search,
      },
      {
        label: 'Asset Management Software',
        href: '/solutions/asset-management',
        description: 'Full lifecycle control across your fleet',
        icon: Boxes,
      },
      {
        label: 'IT Asset Management',
        href: '/solutions/it-asset-management',
        description: 'Laptops, licenses, and devices in one place',
        icon: Laptop,
      },
      {
        label: 'Inventory Management',
        href: '/solutions/inventory-management',
        description: 'Stock levels and reorder alerts, live',
        icon: PackageSearch,
      },
      {
        label: 'Fixed Asset Tracking',
        href: '/solutions/fixed-asset-tracking',
        description: 'Barcode tagging built for audits',
        icon: ScanLine,
      },
      {
        label: 'Tool Tracking Software',
        href: '/solutions/tool-tracking',
        description: 'Check tools in and out by crew and site',
        icon: Hammer,
      },
      {
        label: 'Equipment Tracking Software',
        href: '/solutions/equipment-tracking',
        description: 'Utilization and uptime for heavy gear',
        icon: Gauge,
      },
      {
        label: 'Maintenance Management Software',
        href: '/solutions/maintenance-management',
        description: 'Preventive schedules and work orders',
        icon: Wrench,
      },
    ],
  },
  {
    title: 'Explore',
    items: [
      {
        label: 'Inspection Management Software',
        href: '/solutions/inspection-management',
        description: 'Recurring pass/fail checklists',
        icon: ClipboardCheck,
      },
      {
        label: 'Audit Trail & Compliance Software',
        href: '/solutions/audit-trail-compliance',
        description: 'An immutable log of every change',
        icon: ShieldCheck,
      },
      {
        label: 'All Features',
        href: '/#features',
        description: 'See the complete feature list',
        icon: Layers,
      },
    ],
  },
]

const industriesColumns: NavColumn[] = [
  {
    title: 'Education & public',
    items: [
      {
        label: 'K-12 Schools',
        href: '/industries/k12-schools',
        description: 'Devices, textbooks, and campus gear',
        icon: GraduationCap,
      },
      {
        label: 'Universities & Colleges',
        href: '/industries/universities-colleges',
        description: 'Assets across departments and campuses',
        icon: Landmark,
      },
      {
        label: 'Government',
        href: '/industries/government',
        description: 'Compliance-ready tracking for agencies',
        icon: Building2,
      },
      {
        label: 'Public Works',
        href: '/industries/public-works',
        description: 'Municipal fleets and equipment, tracked',
        icon: Truck,
      },
      {
        label: 'Fire Departments',
        href: '/industries/fire-departments',
        description: 'Apparatus and SCBA gear, inspection-ready',
        icon: Flame,
      },
      {
        label: 'Police Departments',
        href: '/industries/police-departments',
        description: 'Chain-of-custody for issued gear',
        icon: ShieldCheck,
      },
      {
        label: 'Security Agencies',
        href: '/industries/security-agencies',
        description: 'Checkout by guard, shift, and site',
        icon: Lock,
      },
    ],
  },
  {
    title: 'Healthcare & social',
    items: [
      {
        label: 'Healthcare',
        href: '/industries/healthcare',
        description: 'Equipment tracking built for compliance',
        icon: HeartPulse,
      },
      {
        label: 'Nonprofits & Charities',
        href: '/industries/nonprofits-charities',
        description: 'Free tracking, grant-ready reporting',
        icon: HeartHandshake,
      },
      {
        label: 'Churches & Religious Organizations',
        href: '/industries/churches-religious-organizations',
        description: 'Volunteer-friendly gear checkout',
        icon: Church,
      },
    ],
  },
  {
    title: 'Business & industry',
    items: [
      {
        label: 'Construction',
        href: '/industries/construction',
        description: 'Tools and equipment across job sites',
        icon: Hammer,
      },
      {
        label: 'Manufacturing',
        href: '/industries/manufacturing',
        description: 'Machinery and production assets',
        icon: Factory,
      },
      {
        label: 'Small Business',
        href: '/industries/small-business',
        description: 'Simple tracking that scales with you',
        icon: Store,
      },
      {
        label: 'IT Teams',
        href: '/industries/it-teams',
        description: 'Hardware lifecycle for growing teams',
        icon: Laptop,
      },
      {
        label: 'IT Consulting & MSPs',
        href: '/industries/it-consulting-msps',
        description: 'Separate inventories, one dashboard',
        icon: Users,
      },
      {
        label: 'Energy & Utilities',
        href: '/industries/energy-utilities',
        description: 'Field equipment and calibration history',
        icon: Zap,
      },
      {
        label: 'Transportation & Logistics',
        href: '/industries/transportation-logistics',
        description: 'Fleet, trailers, and cargo equipment',
        icon: Truck,
      },
      {
        label: 'Hospitality',
        href: '/industries/hospitality',
        description: 'Equipment and furnishings by property',
        icon: Hotel,
      },
      {
        label: 'Warehousing & Distribution',
        href: '/industries/warehousing-distribution',
        description: 'Material handling equipment on the floor',
        icon: Warehouse,
      },
    ],
  },
]

const compareDescriptions: Record<string, string> = {
  assettiger: 'Free tier limits and search at scale',
  'asset-panda': 'Pricing model and integration depth',
  ezofficeinventory: 'Setup complexity and mobile experience',
  reftab: 'Feature depth beyond IT assets',
  'snipe-it': 'Hosted vs. self-managed tradeoffs',
  sortly: 'Search performance at scale',
}

const compareColumn: NavColumn = {
  title: 'Compare',
  items: compareTargets.map((target) => ({
    label: target.navLabel,
    href: `/compare/${target.slug}`,
    description: compareDescriptions[target.slug] ?? 'See how we compare',
    icon: ArrowLeftRight,
  })),
}

const resourcesColumn: NavColumn = {
  title: 'Resources',
  items: [
    {
      label: 'Blog',
      href: '/blog',
      description: 'Guides on tracking, maintenance, and audits',
      icon: Newspaper,
    },
    {
      label: 'Asset Depreciation Calculator',
      href: '/resources/asset-depreciation-calculator',
      description: 'Estimate depreciation across methods',
      icon: Calculator,
    },
    {
      label: 'ROI Calculator',
      href: '/resources/roi-calculator',
      description: 'Estimate time and loss-prevention savings',
      icon: TrendingUp,
    },
    {
      label: 'Free Asset Tag Generator',
      href: '/resources/asset-tag-generator',
      description: 'Generate printable barcode tags',
      icon: Tag,
    },
    {
      label: 'Asset Management Guide',
      href: '/resources/asset-management-guide',
      description: 'A practical guide to getting started',
      icon: BookOpen,
    },
    {
      label: 'Tutorials',
      href: '/resources/tutorials',
      description: 'Step-by-step written walkthroughs',
      icon: ListChecks,
    },
    {
      label: 'Compare AssetGriffin',
      href: '/compare',
      description: 'See how we stack up against alternatives',
      icon: ArrowLeftRight,
    },
  ],
}

type MenuKey = 'solutions' | 'industries' | 'compare' | 'resources'

const menus: NavMenu[] = [
  {
    key: 'solutions',
    label: 'Solutions',
    title: 'Solutions',
    subtitle: 'Purpose-built tools for every part of asset management.',
    columns: solutionsColumns,
  },
  {
    key: 'industries',
    label: 'Industries',
    title: 'Industries',
    subtitle: 'Built for how your industry actually works.',
    columns: industriesColumns,
  },
  {
    key: 'compare',
    label: 'Compare',
    title: 'Compare',
    subtitle: 'See how AssetGriffin stacks up against the alternatives.',
    columns: [compareColumn],
  },
  {
    key: 'resources',
    label: 'Resources',
    title: 'Resources',
    subtitle: 'Free tools and guides for asset management.',
    columns: [resourcesColumn],
  },
]

const simpleLinks = [
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

const columnGridClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
}

function NavCard({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  const isEnabled = Boolean(item.href)

  const content = (
    <div className="flex items-start gap-2.5 rounded-lg p-2 transition-colors group-hover:bg-secondary">
      {Icon && (
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            isEnabled ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground/60'
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${isEnabled ? 'text-foreground' : 'text-muted-foreground/70'}`}>
          {item.label}
        </p>
        {item.description && (
          <p
            className={`mt-0.5 line-clamp-1 text-xs leading-snug ${isEnabled ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
          >
            {item.description}
          </p>
        )}
        {isEnabled && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary underline decoration-primary/40 underline-offset-2">
            Learn more
          </span>
        )}
      </div>
    </div>
  )

  if (!isEnabled) {
    return (
      <div className="group" aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link href={item.href!} className="group block" onClick={onNavigate}>
      {content}
    </Link>
  )
}

function NavColumns({ columns, onNavigate }: { columns: NavColumn[]; onNavigate: () => void }) {
  const isSingleColumn = columns.length === 1

  return (
    <div className={`grid gap-8 ${columnGridClasses[columns.length] ?? ''}`}>
      {columns.map((column) => (
        <div key={column.title} className="min-w-[240px]">
          <p className="px-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{column.title}</p>
          <div
            className={`mt-2 grid gap-x-6 gap-y-0.5 ${
              isSingleColumn ? 'grid-cols-2 lg:grid-cols-4' : column.items.length > 4 ? 'sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {column.items.map((item) => (
              <NavCard key={item.label} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openMenu(key: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveMenu(key)
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120)
  }

  function closeMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveMenu(null)
  }

  const currentMenu = activeMenu ? menus.find((menu) => menu.key === activeMenu) : null

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm"
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/images/assetgriffin-logo.png"
            alt="AssetGriffin logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-[15px] font-bold tracking-tight text-foreground">AssetGriffin</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {menus.map((menu) => (
            <button
              key={menu.key}
              type="button"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onMouseEnter={() => openMenu(menu.key)}
              onFocus={() => openMenu(menu.key)}
              onClick={() => setActiveMenu((current) => (current === menu.key ? null : menu.key))}
              aria-expanded={activeMenu === menu.key}
            >
              {menu.label}
              <ChevronDown size={14} className={activeMenu === menu.key ? 'rotate-180' : ''} />
            </button>
          ))}
          {simpleLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onMouseEnter={() => setActiveMenu(null)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/app" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Log in
          </Link>
          <Button render={<Link href="/app" />} nativeButton={false} size="lg" className="h-10 rounded-lg px-4 text-sm font-semibold">
            Start free
          </Button>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg text-foreground md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {currentMenu && (
        <div
          className="hidden border-t border-border bg-background md:block"
          onMouseEnter={() => openMenu(currentMenu.key)}
        >
          <div className="mx-auto max-h-[75vh] max-w-6xl overflow-y-auto px-6 py-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">{currentMenu.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{currentMenu.subtitle}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  render={<Link href="/contact" />}
                  nativeButton={false}
                  variant="outline"
                  className="h-9 rounded-lg px-4 text-sm font-semibold"
                  onClick={closeMenu}
                >
                  Talk to sales
                </Button>
                <Button
                  render={<Link href="/app" />}
                  nativeButton={false}
                  className="h-9 rounded-lg px-4 text-sm font-semibold"
                  onClick={closeMenu}
                >
                  Start free
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
            <NavColumns columns={currentMenu.columns} onNavigate={closeMenu} />
          </div>
        </div>
      )}

      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background px-6 py-5 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-6">
            {menus.map((menu) => (
              <div key={menu.key}>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{menu.label}</p>
                <div className="mt-3 flex flex-col gap-4">
                  {menu.columns.map((column) => (
                    <div key={column.title}>
                      {menu.columns.length > 1 && (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                          {column.title}
                        </p>
                      )}
                      <ul className="mt-1.5 flex flex-col gap-2">
                        {column.items
                          .filter((item) => item.href)
                          .map((item) => (
                            <li key={item.label}>
                              <Link href={item.href!} className="text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
                                {item.label}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-4 border-t border-border pt-5">
              {simpleLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ))}
              <Link href="/app" className="text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
                Log in
              </Link>
              <Button render={<Link href="/app" />} nativeButton={false} size="lg" className="h-10 w-full rounded-lg text-sm font-semibold">
                Start free
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
