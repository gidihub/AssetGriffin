import Link from 'next/link'
import Image from 'next/image'

const columns = [
  {
    title: 'Solutions',
    links: [
      { label: 'Asset Tracking Software', href: '/solutions/asset-tracking' },
      { label: 'Asset Management Software', href: '/solutions/asset-management' },
      { label: 'Inspection Management', href: '/solutions/inspection-management' },
      { label: 'Audit Trail & Compliance', href: '/solutions/audit-trail-compliance' },
    ],
    viewAll: { label: 'View all solutions', href: '/solutions' },
  },
  {
    title: 'Compare',
    links: [
      { label: 'vs AssetTiger', href: '/compare/assettiger' },
      { label: 'vs Asset Panda', href: '/compare/asset-panda' },
      { label: 'vs EZOfficeInventory', href: '/compare/ezofficeinventory' },
      { label: 'vs Reftab', href: '/compare/reftab' },
    ],
    viewAll: { label: 'View all comparisons', href: '/compare' },
  },
  {
    title: 'By industry',
    links: [
      { label: 'Construction', href: '/industries/construction' },
      { label: 'K-12 Schools', href: '/industries/k12-schools' },
      { label: 'Healthcare', href: '/industries/healthcare' },
      { label: 'Small Business', href: '/industries/small-business' },
    ],
    viewAll: { label: 'View all industries', href: '/industries' },
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Asset Depreciation Calculator', href: '/resources/asset-depreciation-calculator' },
      { label: 'ROI Calculator', href: '/resources/roi-calculator' },
      { label: 'Free Asset Tag Generator', href: '/resources/asset-tag-generator' },
      { label: 'Asset Management Guide', href: '/resources/asset-management-guide' },
      { label: 'Tutorials', href: '/resources/tutorials' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'GDPR Policy', href: '/gdpr-policy' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Use', href: '/terms-of-use' },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/images/assetgriffin-logo.png"
                alt="AssetGriffin logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-[15px] tracking-tight text-background">AssetGriffin</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              Asset tracking software that scales with you. Free to start, no per-seat pricing, ever.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-background/50">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-background/70 hover:text-background">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {column.viewAll && (
                  <li>
                    <Link
                      href={column.viewAll.href}
                      className="text-sm font-medium text-accent hover:text-accent/80"
                    >
                      {column.viewAll.label}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-background/10 pt-6">
          <p className="text-xs text-background/50">© 2026 AssetGriffin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
