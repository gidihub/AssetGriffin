export interface BlogSection {
  heading: string
  body: string
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readTimeMinutes: number
  sections: BlogSection[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-spreadsheets-break-down-past-200-assets',
    title: 'Why spreadsheets break down past 200 assets',
    excerpt:
      'The failure points aren\u2019t obvious until you hit them: no unique IDs, no automatic history, and search that gets slower every quarter.',
    category: 'Asset Tracking',
    date: '2026-08-12',
    readTimeMinutes: 6,
    sections: [
      {
        heading: 'The first 200 assets are easy',
        body: 'A single tab with columns for name, location, and owner works fine when one person maintains it and the list fits on a screen. Most teams start here, and there is nothing wrong with that \u2014 it is the right tool for a small, static inventory.',
      },
      {
        heading: 'Where it starts to crack',
        body: 'Growth changes the problem. Once more than one person edits the sheet, conflicting updates start to appear \u2014 two people move the same laptop to two different rooms and only one edit survives. Once the row count climbs into the thousands, a simple Ctrl+F search stops being reliable because descriptions drift ("MacBook", "Macbook Pro 14", "laptop #12") and there is no enforced unique identifier tying a physical item to its row.',
      },
      {
        heading: 'The three failure points',
        body: 'In practice, spreadsheets break down for the same three reasons every time: no unique ID enforcement, so duplicate or missing rows go unnoticed; no automatic history, so nobody can say who moved an asset or when without manually logging it; and no mobile-friendly way to update records at the point of use, so updates happen from memory hours or days later \u2014 and memory is where accuracy goes to die.',
      },
      {
        heading: 'What to do about it',
        body: 'The fix isn\u2019t more discipline, it\u2019s a system that enforces the things a spreadsheet can\u2019t: a scannable tag per asset, a mobile check-in/check-out flow, and an audit trail that logs itself. You don\u2019t need to migrate everything at once \u2014 most teams start by tagging their highest-value or highest-loss category first and expand from there.',
      },
    ],
  },
  {
    slug: 'preventive-maintenance-schedule-framework',
    title: 'A practical framework for preventive maintenance schedules',
    excerpt:
      'Reactive maintenance is expensive because it happens on the equipment\u2019s schedule, not yours. Here\u2019s how to build a schedule that gets ahead of it.',
    category: 'Maintenance',
    date: '2026-07-29',
    readTimeMinutes: 5,
    sections: [
      {
        heading: 'Reactive vs. preventive',
        body: 'Reactive maintenance means fixing equipment after it fails. It feels cheaper in the moment because nothing is spent until something breaks, but the total cost is almost always higher \u2014 unplanned downtime, expedited parts shipping, and the ripple effect of a broken tool stopping a crew or a line. Preventive maintenance flips the order: service on a schedule, before failure.',
      },
      {
        heading: 'Three ways to trigger a schedule',
        body: 'Not every asset should be scheduled the same way. Calendar-based triggers (every 90 days) work for equipment that degrades with time regardless of use, like fire extinguishers or HVAC filters. Usage-based triggers (every 500 operating hours) fit equipment where wear tracks with actual use, like generators or forklifts. Meter-based triggers (every 5,000 miles) are the standard for vehicles. Picking the wrong trigger type is the most common reason a maintenance program drifts out of date \u2014 a calendar schedule on a rarely-used machine wastes service visits, while a usage schedule on a machine nobody logs hours for never triggers at all.',
      },
      {
        heading: 'Start with manufacturer intervals',
        body: 'Every piece of equipment with a manual has a manufacturer-recommended service interval \u2014 that\u2019s your starting schedule, not a guess. Deviating from it (extending intervals to save on service costs) tends to show up later as a warranty issue or a shortened equipment lifespan, so it\u2019s worth treating the manual\u2019s numbers as the default and only adjusting with data, not intuition.',
      },
      {
        heading: 'Make the schedule visible to whoever does the work',
        body: 'A maintenance schedule that lives in one manager\u2019s calendar doesn\u2019t get done reliably. The schedule needs to surface to the technician or crew responsible, ideally as a due-soon list they can see without asking, with a way to log the completed service against the specific asset so the next due date calculates automatically.',
      },
    ],
  },
  {
    slug: 'run-a-physical-asset-audit-in-an-afternoon',
    title: 'How to run a physical asset audit in an afternoon',
    excerpt:
      'The difference between a day-long audit and an afternoon one usually comes down to a single decision: how you cross-reference the list.',
    category: 'Audits',
    date: '2026-07-14',
    readTimeMinutes: 5,
    sections: [
      {
        heading: 'What an audit actually verifies',
        body: 'A physical audit confirms three things for every asset on your register: it exists, it is where the record says it is, and it is in the condition the record implies. Skipping any one of those turns the audit into a paperwork exercise rather than a real check.',
      },
      {
        heading: 'The manual-list problem',
        body: 'The slow version of an audit involves printing the register, walking the location, and manually finding each item on the printed list \u2014 which means constant back-and-forth between the physical item and a multi-page document, and it\u2019s where most audit time actually goes. Doubling the asset count roughly doubles this lookup time, which is why audits that took an hour at 100 assets can take a full day at 1,000.',
      },
      {
        heading: 'Scanning changes the math',
        body: 'If every asset has a scannable tag, the lookup step disappears \u2014 scan the tag, the record pulls up instantly, and you mark it present or flag a discrepancy on the spot. The auditor never has to search a list at all; the list finds itself. This is the single biggest time saver in moving from spreadsheet audits to tag-based ones.',
      },
      {
        heading: 'Handling what you can\u2019t find',
        body: 'Every audit turns up a few assets that can\u2019t be located. Resist the urge to delete them immediately \u2014 flag them as "not found" with the audit date, then give it one more audit cycle before writing them off. Assets often turn up in a different department or a storage room that just wasn\u2019t on the walk route, and a two-audit grace period catches most of those without letting genuinely lost items linger indefinitely.',
      },
    ],
  },
  {
    slug: 'barcode-vs-qr-code-asset-tags',
    title: 'Barcode vs. QR code tags: which should you use?',
    excerpt:
      'Both work. The right choice depends on scanning distance, label size, and whether you need to encode more than an ID.',
    category: 'Asset Tracking',
    date: '2026-06-30',
    readTimeMinutes: 4,
    sections: [
      {
        heading: 'What each format is good at',
        body: 'A 1D barcode (like Code 128) is compact and fast to scan with a dedicated laser scanner, and it\u2019s a familiar format if your team already scans barcodes elsewhere. A QR code holds far more data per square inch and can be reliably scanned with any phone camera at an angle or from a slight distance \u2014 no dedicated hardware required.',
      },
      {
        heading: 'The phone-camera factor',
        body: 'If your team is scanning with phones rather than dedicated barcode readers \u2014 which is now the majority case \u2014 QR codes are the more forgiving format. They tolerate more damage, more angle, and more distance before a scan fails, which matters when tags end up on curved equipment, dusty tools, or something bolted to a ceiling.',
      },
      {
        heading: 'Label size constraints',
        body: 'On very small assets \u2014 a hand tool, a piece of lab equipment \u2014 label real estate is the deciding factor. A 1D barcode can be printed narrower for a given data length than a QR code of equivalent readability, so tiny assets sometimes favor barcodes purely on physical space.',
      },
      {
        heading: 'Our recommendation',
        body: 'For most teams, QR codes are the better default: phone-camera compatibility outweighs the space savings of a 1D barcode for the vast majority of asset sizes. Reserve 1D barcodes for cases with genuinely tight label space or an existing barcode-scanner investment you want to keep using.',
      },
    ],
  },
  {
    slug: 'role-based-permissions-without-slowing-your-team-down',
    title: 'Setting up role-based permissions without slowing your team down',
    excerpt:
      'The goal isn\u2019t to lock everything down \u2014 it\u2019s to make sure the right five people can approve a change and everyone else can still do their job.',
    category: 'Operations',
    date: '2026-06-16',
    readTimeMinutes: 5,
    sections: [
      {
        heading: 'The over-restriction trap',
        body: 'The most common permissions mistake is starting too locked down. If a technician needs manager approval to log a routine maintenance visit, they\u2019ll either stop logging it or route around the system entirely \u2014 and a permissions model that gets bypassed is worse than no permissions model at all.',
      },
      {
        heading: 'Separate "can view" from "can approve"',
        body: 'Most day-to-day actions \u2014 checking an asset in or out, logging a completed inspection, updating a location \u2014 don\u2019t need approval, just visibility into what changed. Reserve approval gates for actions with real financial or compliance weight: disposing of an asset, approving a purchase over a threshold, or changing an asset\u2019s assigned custodian.',
      },
      {
        heading: 'Design around roles, not individuals',
        body: 'Assigning permissions to a named person instead of a role ("Sarah can approve disposals") creates a gap the moment Sarah is out or changes teams. Define roles first \u2014 technician, site manager, finance approver \u2014 and assign people to roles, so coverage doesn\u2019t depend on any one person being available.',
      },
      {
        heading: 'Audit who actually used what',
        body: 'After the first few months, review the audit log for permissions that were granted but never used, and roles that get blocked constantly and clearly need broader access. Permissions models that aren\u2019t revisited tend to drift toward either too much friction or too little control \u2014 checking in on it quarterly keeps it balanced.',
      },
    ],
  },
  {
    slug: 'real-cost-of-untracked-equipment-loss',
    title: 'The real cost of untracked equipment loss',
    excerpt:
      'Lost and misplaced equipment rarely shows up as a line item \u2014 it shows up as unplanned repurchases, spread across a dozen different budget lines.',
    category: 'Operations',
    date: '2026-05-28',
    readTimeMinutes: 4,
    sections: [
      {
        heading: 'Why loss is invisible in most budgets',
        body: 'When a piece of equipment goes missing, most teams don\u2019t log it as a loss \u2014 they just buy a replacement and code it to whatever budget line fits. That means the true cost of untracked equipment never appears anywhere as a single number; it\u2019s scattered across a year of small repurchases that nobody adds up.',
      },
      {
        heading: 'The compounding effect',
        body: 'Untracked loss doesn\u2019t stay flat \u2014 it tends to grow with headcount and asset count, because more people handling more items without a shared record means more opportunities for something to end up in the wrong truck, the wrong office, or a departing employee\u2019s bag unnoticed.',
      },
      {
        heading: 'What a tracking record actually prevents',
        body: 'A tracked asset that\u2019s checked out to a specific person creates accountability that a shared, untracked supply closet never can. It doesn\u2019t eliminate loss, but it substantially reduces the "nobody knows where it went" category, which is typically the largest share of equipment loss for teams that haven\u2019t implemented any tracking at all.',
      },
      {
        heading: 'A reasonable way to estimate your exposure',
        body: 'A rough starting estimate: take your total equipment value, multiply by an estimated annual loss rate for untracked inventory (industry surveys commonly cite low single digits as a percentage), and treat that as a conservative floor \u2014 not a precise figure, but enough to make the case for whether a tracking system pays for itself.',
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}
