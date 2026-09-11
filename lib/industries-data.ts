import {
  Smartphone,
  MapPin,
  Wrench,
  ClipboardCheck,
  UserCheck,
  Upload,
  Hammer,
  RotateCcw,
  ShieldCheck,
  CalendarClock,
  Lock,
  FileCheck,
  DollarSign,
  Ban,
  Zap,
  Building2,
  CalendarRange,
  History,
  Plug,
  LineChart,
  ScanLine,
  Recycle,
  Laptop,
  Truck,
  HeartHandshake,
  Church,
  Users,
  Hotel,
  Warehouse,
  Route,
  PackageSearch,
  BedDouble,
  type LucideIcon,
} from 'lucide-react'
import type { FaqItem } from '@/components/marketing/faq-accordion'
import type { ComparisonRow } from '@/components/marketing/comparison-table'

export const spreadsheetComparisonRows: ComparisonRow[] = [
  {
    label: 'Asset location',
    valueA: 'Updated the moment an asset is scanned, checked out, or transferred',
    valueB: 'Only as current as the last person remembered to update the sheet',
  },
  {
    label: 'Mobile scanning',
    valueA: 'Scan barcode or QR tags with any phone camera — no separate hardware',
    valueB: 'No built-in scanning; lookups and entries are typed in by hand',
  },
  {
    label: 'Multi-user access',
    valueA: 'Any authorized team member can check assets in or out from the field',
    valueB: 'Usually edited by one person at a time to avoid overwriting changes',
  },
  {
    label: 'Audit trail',
    valueA: 'Full history of every checkout, transfer, and change is kept automatically',
    valueB: 'History depends on manually saved versions, if any exist at all',
  },
  {
    label: 'Maintenance reminders',
    valueA: 'Built-in reminders for upcoming inspections and maintenance',
    valueB: 'Due dates have to be tracked and remembered separately',
  },
]

export interface IndustryFeature {
  icon: LucideIcon
  title: string
  body: string
}

export interface IndustryPage {
  slug: string
  navLabel: string
  industryName: string
  ctaNoun: string
  metaTitle: string
  metaDescription: string
  intro: string
  features: IndustryFeature[]
  useCase: { title: string; body: string }
  faqs: FaqItem[]
}

export const industries: IndustryPage[] = [
  {
    slug: 'construction',
    navLabel: 'Construction',
    industryName: 'construction teams',
    ctaNoun: 'equipment',
    metaTitle: 'Construction Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track tools and heavy equipment across job sites with mobile scanning, maintenance schedules, and inspection checklists built for crews in the field.',
    intro:
      'It\u2019s 6:45 a.m. and a foreman is standing at the gate of Site B, short one plate compactor and two ladders that were supposed to come over from Site A last week. He calls the Site A foreman, who thinks the compactor went to the yard for service, but isn\u2019t sure when. Twenty minutes and three phone calls later, the crew starts the day without it. AssetGriffin gives crews a way to log every transfer from a phone in the field, so that 6:45 a.m. call is a lookup instead of a guessing game.',
    features: [
      {
        icon: Smartphone,
        title: 'Scan from any phone',
        body: 'Check equipment in or out with the camera crews already carry — no dedicated scanner or app-store install required.',
      },
      {
        icon: MapPin,
        title: 'Location tracking across sites',
        body: 'See which site, trailer, or truck an asset is on right now, with a full history of every transfer between them.',
      },
      {
        icon: CalendarClock,
        title: 'Maintenance scheduling',
        body: 'Schedule service by hours, mileage, or calendar time so equipment gets serviced before a breakdown stalls a job.',
      },
      {
        icon: ClipboardCheck,
        title: 'Inspection checklists for heavy equipment',
        body: 'Recurring pass/fail checklists for heavy equipment and power tools that automatically flag failures and open a maintenance task.',
      },
    ],
    useCase: {
      title: 'Tracking a mini excavator across three active job sites',
      body: 'A general contractor running three concurrent builds could scan a mini excavator into a mobile app each time it moved between sites, capturing the destination and the crew member responsible. When the machine was needed on a fourth site, the project manager could check its last known location on a phone instead of calling around — this is an illustrative example of how the workflow is designed to work, not a reported customer result.',
    },
    faqs: [
      {
        question: 'Do we need dedicated scanners for job-site equipment?',
        answer:
          'No. AssetGriffin uses the camera on any phone crews already carry to scan tags, so there is no dedicated hardware to buy, charge, or lose on-site.',
      },
      {
        question: 'Does it work with spotty job-site connectivity?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so crews can keep checking equipment in and out even in areas with weak signal.',
      },
      {
        question: 'Can we track both small tools and heavy equipment?',
        answer:
          'Yes. The same directory handles hand tools, power tools, and heavy equipment like excavators and generators, each with its own maintenance and inspection schedule.',
      },
      {
        question: 'Who can see where equipment currently is?',
        answer:
          'Any team member you grant access to can look up an asset and see its current site, last transfer, and full history — no more calling around between crews.',
      },
      {
        question: 'Does AssetGriffin work with Procore or our accounting software?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the project management and accounting tools construction teams already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our equipment and job-site data secure, and who owns it?',
        answer:
          'Your equipment and location data belongs to your company. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep using the asset tags we already have on our equipment?',
        answer:
          'Yes. During import you can map your existing tag or serial numbers to each asset instead of re-tagging everything, so equipment already labeled in the field does not need new tags to get started.',
      },
      {
        question: 'Can we track rented equipment separately from equipment we own?',
        answer:
          'Yes. Rented and owned equipment can be tracked in the same directory with their own category, so a rental return date does not get confused with equipment your company owns outright.',
      },
      {
        question: 'Can we generate an equipment list for insurance or bonding purposes?',
        answer:
          'Yes. You can export a full asset list with current value and location, in a format built to hand directly to an insurer or bonding company.',
      },
      {
        question: 'How do we import our existing equipment list and get started?',
        answer:
          'Bulk import brings your current spreadsheet of tools and equipment in as a single pass, and most crews are checking equipment in and out from a phone the same day.',
      },
    ],
  },
  {
    slug: 'k12-schools',
    navLabel: 'K-12 Schools',
    industryName: 'K-12 schools',
    ctaNoun: 'devices',
    metaTitle: 'K-12 Asset Management Software | AssetGriffin',
    metaDescription:
      'Track 1:1 devices, shared AV equipment, and furniture with check-outs by student name, bulk import, and end-of-year return workflows.',
    intro:
      'A 1:1 device program can put thousands of laptops and tablets in students\u2019 hands, and shared AV carts and furniture move between classrooms just as often — all of it usually tracked in an outdated spreadsheet that someone updates when they remember to. AssetGriffin replaces that spreadsheet with a directory built for checking assets out to people by name and getting them back at the end of the year.',
    features: [
      {
        icon: UserCheck,
        title: 'Check out to students and staff by name',
        body: 'Assign any device or piece of equipment to a specific student or staff member, with a timestamped record of who has it.',
      },
      {
        icon: Upload,
        title: 'Bulk import',
        body: 'Import your entire device fleet and furniture inventory from a spreadsheet in one pass instead of entering assets one at a time.',
      },
      {
        icon: Hammer,
        title: 'Damage and repair tracking',
        body: 'Log damage reports and repair status on any device so front-office staff can see at a glance what is out for service.',
      },
      {
        icon: RotateCcw,
        title: 'End-of-year return workflows',
        body: 'Run a checklist-driven collection process at year-end so every device is accounted for before summer break.',
      },
    ],
    useCase: {
      title: 'Closing out a 1:1 laptop program at year-end',
      body: 'A middle school issuing laptops to every student could use a return workflow at the end of the school year to check each device back in against the original checkout record, flagging any laptop still marked as outstanding after the deadline. This is an illustrative scenario meant to show how the workflow could be used, not a documented result from a specific district.',
    },
    faqs: [
      {
        question: 'Can we check devices out to individual students?',
        answer:
          'Yes. Each device can be assigned to a specific student or staff member by name, with a full history of who has held it and when.',
      },
      {
        question: 'How do we get our existing inventory into AssetGriffin?',
        answer:
          'Bulk import lets you bring in your entire spreadsheet of devices, AV equipment, and furniture in one import instead of adding items one at a time.',
      },
      {
        question: 'What happens when a device comes back damaged?',
        answer:
          'You can log a damage or repair note directly on the asset record, so front-office and IT staff can see repair status without a separate ticketing system.',
      },
      {
        question: 'How does end-of-year collection work?',
        answer:
          'A return workflow checks each issued device back in against its original checkout, making it easy to see which devices are still outstanding as the deadline approaches.',
      },
      {
        question: 'Does AssetGriffin work with Google Workspace and our SIS?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the identity and student information systems districts already run — reach out to discuss connecting Google Workspace or your SIS.',
      },
      {
        question: 'Is our student and device data secure, and who owns it?',
        answer:
          'Your student and device data belongs to your district. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we scan existing barcodes and textbook ISBNs?',
        answer:
          'Yes. During import you can map existing barcode or ISBN numbers to each device or textbook instead of generating new tags, so items already labeled do not need to be re-tagged.',
      },
      {
        question: 'Does AssetGriffin work without a signal?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so staff can keep checking devices in and out in classrooms or storage rooms with weak Wi-Fi.',
      },
      {
        question: 'Can we track devices bought with E-Rate, ESSER, bonds, or other grants?',
        answer:
          'Yes. You can tag devices by funding source and export a report showing exactly which grant or bond paid for which device, for funder or auditor review.',
      },
      {
        question: 'How do we import our inventory and roll out AssetGriffin?',
        answer:
          'Bulk import brings your entire device, AV, and furniture spreadsheet in as a single pass, and most districts have staff checking devices out to students within a day.',
      },
    ],
  },
  {
    slug: 'healthcare',
    navLabel: 'Healthcare',
    industryName: 'healthcare teams',
    ctaNoun: 'equipment',
    metaTitle: 'Healthcare Asset Management Software | AssetGriffin',
    metaDescription:
      'Track medical equipment with an immutable audit trail, calibration and maintenance scheduling, role-based permissions, and compliance-ready reporting.',
    intro:
      'Mobile equipment like infusion pumps and monitors moves between departments constantly, and when a compliance audit asks for a documented maintenance and calibration history, the stakes for having a clean record are real. AssetGriffin keeps that history automatically, so an audit is a report export instead of a scramble through paper logs.',
    features: [
      {
        icon: History,
        title: 'Immutable audit trail',
        body: 'Every checkout, transfer, and status change is logged permanently, so chain-of-custody records hold up under review.',
      },
      {
        icon: CalendarClock,
        title: 'Calibration and maintenance scheduling',
        body: 'Set recurring calibration and preventive maintenance by manufacturer requirements, with automatic reminders before service is due.',
      },
      {
        icon: Lock,
        title: 'Role-based permissions',
        body: 'Control who can view, edit, or check out specific equipment categories, so sensitive or high-value equipment stays restricted.',
      },
      {
        icon: FileCheck,
        title: 'Compliance-ready reporting',
        body: 'Export maintenance history, custody records, and activity logs in a format built for regulatory and compliance review.',
      },
    ],
    useCase: {
      title: 'Producing a calibration report ahead of a compliance review',
      body: 'A hospital biomedical engineering team preparing for a compliance review could export a report of every infusion pump\u2019s calibration history directly from the audit trail, rather than reconstructing it from paper logs across departments. This is an illustrative scenario describing intended use, not a verified customer outcome.',
    },
    faqs: [
      {
        question: 'Can the audit trail be edited or deleted after the fact?',
        answer:
          'No. The audit trail is immutable — every action is permanently logged with a timestamp and the user who performed it, which is what makes it usable for compliance review.',
      },
      {
        question: 'Can we set calibration schedules that match manufacturer requirements?',
        answer:
          'Yes. Calibration and maintenance schedules can be configured per asset or asset category, with automatic reminders before service is due.',
      },
      {
        question: 'Can we restrict who has access to certain equipment records?',
        answer:
          'Role-based permissions let you control which staff can view, edit, or check out specific equipment categories.',
      },
      {
        question: 'Is AssetGriffin a substitute for a validated quality management system?',
        answer:
          'AssetGriffin tracks location, custody, and maintenance history for equipment asset management. It is not a substitute for a validated QMS, and you should confirm it fits your specific regulatory requirements before relying on it for compliance-critical workflows.',
      },
      {
        question: 'Does AssetGriffin work with our EHR or biomedical equipment management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the EHR and biomedical equipment systems your facility already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our equipment and patient-adjacent data secure, and who owns it?',
        answer:
          'Your equipment and custody data belongs to your facility. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we scan the asset tags already on our equipment?',
        answer:
          'Yes. During import you can map existing asset tag or serial numbers to each piece of equipment instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does AssetGriffin work in areas of the facility with weak Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so staff can keep checking equipment in and out in basements or shielded rooms with weak signal.',
      },
      {
        question: 'Can we track equipment purchased with capital equipment funds or grants?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which capital budget or grant paid for which asset, for finance or funder review.',
      },
      {
        question: 'How do we import our existing equipment inventory?',
        answer:
          'Bulk import brings your current spreadsheet of mobile and fixed equipment in as a single pass, and most biomedical teams are scanning equipment within a day.',
      },
    ],
  },
  {
    slug: 'small-business',
    navLabel: 'Small Business',
    industryName: 'small businesses',
    ctaNoun: 'assets',
    metaTitle: 'Small Business Asset Management Software | AssetGriffin',
    metaDescription:
      'Track equipment and inventory without enterprise pricing. Free up to 250 assets, unlimited users, no contracts, and setup in minutes.',
    intro:
      'Picture a 15-person landscaping or repair shop pricing out asset tracking software billed per user: at $8 to $15 per seat per month, that\u2019s $120 to $225 a month before a single asset is tracked, and the bill climbs every time someone new is hired. AssetGriffin tracks up to 250 assets for free with every team member included, and its paid plans are priced per workspace, not per seat, so growing the team doesn\u2019t grow the bill.',
    features: [
      {
        icon: DollarSign,
        title: 'Free up to 250 assets, unlimited users',
        body: 'Track your first 250 assets at no cost, with as many team members on the account as you need — no per-seat fees.',
      },
      {
        icon: Ban,
        title: 'No contracts or per-seat fees',
        body: 'Pay for what you track, not for how many people log in. Cancel anytime, no annual commitment required.',
      },
      {
        icon: Zap,
        title: 'Fast setup',
        body: 'Import your existing spreadsheet and start tracking assets the same day — no onboarding project required.',
      },
      {
        icon: Smartphone,
        title: 'Phone-camera scanning',
        body: 'Scan and check out assets using the phone your team already has, without buying dedicated scanning hardware.',
      },
    ],
    useCase: {
      title: 'Moving a 15-person shop off a shared spreadsheet',
      body: 'A small landscaping or repair business could move its equipment list from a shared spreadsheet into AssetGriffin in an afternoon, printing tags for its trucks and tools and inviting every crew member to check items in and out from their phone. This is an illustrative scenario showing how setup could work, not a documented customer story.',
    },
    faqs: [
      {
        question: 'Is there really no cost until we exceed 250 assets?',
        answer:
          'Correct. Tracking is free for up to 250 assets with unlimited users on the account. You only pay if you grow past that.',
      },
      {
        question: 'Do we need to sign a contract?',
        answer:
          'No. There is no long-term contract or per-seat fee — you can cancel at any time.',
      },
      {
        question: 'How long does setup actually take?',
        answer:
          'Most small teams import their existing spreadsheet and are checking assets in and out the same day, without a formal onboarding process.',
      },
      {
        question: 'Do we need to buy scanners?',
        answer:
          'No. Any team member can scan an asset tag using their phone\u2019s camera, so there is no extra hardware to purchase.',
      },
      {
        question: 'Does AssetGriffin work with QuickBooks or our accounting software?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the accounting and point-of-sale tools small businesses already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our business data secure, and who owns it?',
        answer:
          'Your asset data belongs to your business. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags or labels we already use?',
        answer:
          'Yes. During import you can map your existing tag or serial numbers to each asset instead of generating new ones, so anything already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does the app work if we lose signal in the field?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so field crews can keep checking equipment in and out even in areas with weak signal.',
      },
      {
        question: 'Can we track which equipment was financed versus paid for outright?',
        answer:
          'Yes. You can tag assets by how they were purchased and export a report showing financed versus owned equipment, useful when reviewing your books.',
      },
      {
        question: 'How do we import our current spreadsheet and get started?',
        answer:
          'Bulk import brings your entire equipment list in as a single pass, and most small teams are checking assets in and out from a phone the same day.',
      },
    ],
  },
  {
    slug: 'universities-colleges',
    navLabel: 'Universities & Colleges',
    industryName: 'universities and colleges',
    ctaNoun: 'equipment',
    metaTitle: 'Higher Education Asset Management Software | AssetGriffin',
    metaDescription:
      'Track lab equipment, AV, and dorm furniture across buildings and departments with department-level permissions and semester check-out workflows.',
    intro:
      'Lab equipment, AV carts, and dorm furniture move across many buildings and departments every semester, and high student turnover makes it easy to lose track of who has what. AssetGriffin gives campus departments their own view of their equipment while keeping one shared directory underneath.',
    features: [
      {
        icon: Building2,
        title: 'Department-level permissions',
        body: 'Give each department visibility into its own equipment without exposing inventory across the rest of campus.',
      },
      {
        icon: CalendarRange,
        title: 'Bulk check-out for semester loans',
        body: 'Check out equipment to a whole class or cohort at once for the semester, then reconcile returns in bulk when the term ends.',
      },
      {
        icon: History,
        title: 'Asset history across academic years',
        body: 'See the complete usage and maintenance history of an asset across multiple academic years, not just the current term.',
      },
      {
        icon: Plug,
        title: 'Integration-ready for campus IT systems',
        body: 'Connect asset data with the identity and IT systems your campus already runs, instead of maintaining a disconnected list.',
      },
    ],
    useCase: {
      title: 'Loaning lab equipment to a semester-long cohort',
      body: 'A chemistry department could check out a set of lab instruments to an entire course roster at the start of a semester, then run a bulk return reconciliation at finals week to flag any instrument not yet returned. This is an illustrative scenario describing an intended workflow, not a reported result from a specific institution.',
    },
    faqs: [
      {
        question: 'Can different departments manage their own equipment separately?',
        answer:
          'Yes. Department-level permissions let each department see and manage its own inventory without visibility into every other department\u2019s assets.',
      },
      {
        question: 'Can we check equipment out to an entire class at once?',
        answer:
          'Yes. Bulk check-out lets you assign equipment to a full class or cohort for the semester, then reconcile returns together at term end.',
      },
      {
        question: 'Does asset history carry over between academic years?',
        answer:
          'Yes. Every asset keeps its full usage and maintenance history across academic years, not just the current semester.',
      },
      {
        question: 'Can this connect to our existing campus IT systems?',
        answer:
          'AssetGriffin is designed to be integration-ready with common campus identity and IT systems — reach out to discuss your specific stack.',
      },
      {
        question: 'Is our lab and student equipment data secure, and who owns it?',
        answer:
          'Your equipment and checkout data belongs to your institution. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we scan existing barcodes on lab equipment and AV carts?',
        answer:
          'Yes. During import you can map existing barcode or asset tag numbers to each item instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work in buildings with poor Wi-Fi coverage?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so staff can keep checking equipment in and out in labs or storage areas with weak signal.',
      },
      {
        question: 'Can we track equipment purchased with grants or endowment funds?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which grant or endowment paid for which asset, for sponsor or audit review.',
      },
      {
        question: 'How do we import our existing inventory across departments?',
        answer:
          'Bulk import brings each department\u2019s spreadsheet in as a single pass, and departments can start checking equipment out to students within a day.',
      },
      {
        question: 'Can we generate reports for a Title IV or accreditation review?',
        answer:
          'Yes. Asset and usage history export in a format built for accreditation and compliance review across departments.',
      },
    ],
  },
  {
    slug: 'manufacturing',
    navLabel: 'Manufacturing',
    industryName: 'manufacturing teams',
    ctaNoun: 'tools and equipment',
    metaTitle: 'Manufacturing Asset Management Software | AssetGriffin',
    metaDescription:
      'Track tools, machinery, and fixed assets across the production floor with preventive maintenance, depreciation tracking, and safety inspections.',
    intro:
      'Tools, machinery, and fixed assets move across a production floor where downtime is expensive, and a missed maintenance window can shut down a line. AssetGriffin keeps preventive maintenance, depreciation, and safety inspections tied to the same asset record your floor already scans.',
    features: [
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Schedule service by run hours or calendar time so machinery is serviced before it fails mid-production.',
      },
      {
        icon: LineChart,
        title: 'Depreciation tracking for fixed assets',
        body: 'Track depreciation on fixed assets alongside their maintenance and location history, in the same system your floor uses daily.',
      },
      {
        icon: ClipboardCheck,
        title: 'Inspection checklists tied to safety compliance',
        body: 'Run recurring pass/fail safety inspections on machinery, with failures automatically opening a maintenance task.',
      },
      {
        icon: ScanLine,
        title: 'Barcode and QR scanning on the floor',
        body: 'Scan tools and equipment from any phone on the floor to log checkouts, transfers, and inspection results in real time.',
      },
    ],
    useCase: {
      title: 'Catching a failed inspection before a shift starts',
      body: 'A production supervisor could run a pre-shift safety inspection checklist on a stamping press, and a failed item could automatically open a maintenance task before the line starts, rather than being discovered mid-run. This is an illustrative scenario showing intended functionality, not a reported customer outcome.',
    },
    faqs: [
      {
        question: 'Can maintenance schedules be based on run hours instead of just calendar time?',
        answer:
          'Yes. Preventive maintenance can be scheduled by usage hours, mileage-equivalent metrics, or calendar time, depending on what best fits the asset.',
      },
      {
        question: 'Does AssetGriffin handle fixed asset depreciation?',
        answer:
          'Yes. Fixed assets can carry depreciation tracking alongside their location and maintenance history in the same record.',
      },
      {
        question: 'What happens when a safety inspection fails?',
        answer:
          'A failed inspection item automatically opens a maintenance task, so the issue is tracked rather than relying on someone to remember to report it.',
      },
      {
        question: 'Do we need dedicated barcode scanners on the floor?',
        answer:
          'No. Any phone camera can scan barcode or QR tags to log checkouts, transfers, and inspections in real time.',
      },
      {
        question: 'Does AssetGriffin work with our ERP or CMMS?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the ERP and CMMS systems your plant already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our production floor data secure, and who owns it?',
        answer:
          'Your equipment and maintenance data belongs to your company. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our machinery?',
        answer:
          'Yes. During import you can map existing barcode or serial numbers to each machine instead of generating new tags, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work in areas of the plant without Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so floor staff can keep logging checkouts and inspections even in areas with weak signal.',
      },
      {
        question: 'Can we track fixed assets bought with capital expenditure budgets?',
        answer:
          'Yes. You can tag assets by funding source and export a report showing which CapEx budget paid for which piece of equipment, alongside its depreciation schedule.',
      },
      {
        question: 'How do we import our existing equipment list and roll this out on the floor?',
        answer:
          'Bulk import brings your current spreadsheet of tools, machinery, and fixed assets in as a single pass, and most plants have floor staff scanning within a day.',
      },
    ],
  },
  {
    slug: 'government',
    navLabel: 'Government',
    industryName: 'government agencies',
    ctaNoun: 'equipment',
    metaTitle: 'Government & Municipal Asset Management Software | AssetGriffin',
    metaDescription:
      'Track taxpayer-funded equipment across state, county, and municipal departments with an immutable audit trail, role-based access, and compliance-ready reporting.',
    intro:
      'A mid-size municipality can easily run a dozen departments — public works, parks and rec, code enforcement, IT, facilities — each buying and tracking its own equipment with its own spreadsheet, or none at all. When the city manager needs a single answer about what the city owns and where it is, that answer means calling every department head and waiting for a dozen different files to come back. AssetGriffin keeps a permanent, department-tagged record of every asset from procurement to disposal, ready for the audit before it happens.',
    features: [
      {
        icon: History,
        title: 'Immutable audit trail',
        body: 'Every checkout, transfer, and status change is logged permanently and attributed to a specific user, satisfying public accountability requirements.',
      },
      {
        icon: Lock,
        title: 'Role-based access across departments',
        body: 'Give each department control over its own equipment while administrators retain oversight across the full inventory.',
      },
      {
        icon: FileCheck,
        title: 'Compliance-ready reporting',
        body: 'Export activity logs and custody records in a format built for public audit and procurement compliance review.',
      },
      {
        icon: Recycle,
        title: 'Asset lifecycle tracking from procurement to disposal',
        body: 'Track an asset from the day it is procured through every transfer to its final disposal, with a complete lifecycle record.',
      },
    ],
    useCase: {
      title: 'Responding to a public records request on equipment custody',
      body: 'A municipal department could respond to a records request about a piece of equipment by exporting its full custody history — every department and employee who held it since procurement — directly from the audit trail. This is an illustrative scenario describing intended use, not a documented result from a specific agency.',
    },
    faqs: [
      {
        question: 'Can audit records be altered after they are created?',
        answer:
          'No. The audit trail is immutable, which is what makes it usable for public accountability and audit requirements.',
      },
      {
        question: 'Can different departments manage their own equipment independently?',
        answer:
          'Yes. Role-based access lets each department manage its own inventory while administrators keep oversight of the full agency-wide inventory.',
      },
      {
        question: 'Can we track an asset all the way through disposal?',
        answer:
          'Yes. Lifecycle tracking follows an asset from procurement through every transfer to its final disposal record.',
      },
      {
        question: 'Can we produce records for a public audit or records request?',
        answer:
          'Yes. Compliance-ready reporting exports activity logs and custody records in a format built for audit and public records review.',
      },
      {
        question: 'Does AssetGriffin work with our GIS or procurement system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the GIS and procurement systems agencies already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our agency\u2019s equipment data secure, and who owns it?',
        answer:
          'Your equipment and custody data belongs to your agency. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our equipment?',
        answer:
          'Yes. During import you can map existing barcode or tag numbers to each asset instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work for field staff without reliable connectivity?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so field staff can keep checking equipment in and out in areas with weak signal.',
      },
      {
        question: 'Can we track equipment bought with bonds or specific grant funding?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which bond or grant paid for which asset, for budget or funder review.',
      },
      {
        question: 'How do we import our existing inventory across departments?',
        answer:
          'Bulk import brings each department\u2019s spreadsheet in as a single pass, and departments can start tracking equipment within a day.',
      },
    ],
  },
  {
    slug: 'it-teams',
    navLabel: 'IT Teams',
    industryName: 'IT teams',
    ctaNoun: 'hardware',
    metaTitle: 'IT Asset Management Software for IT Teams | AssetGriffin',
    metaDescription:
      'Track hardware, software licenses, and warranty coverage across a distributed workforce with IT-specific fields, expiration alerts, and checkout history.',
    intro:
      'A distributed workforce means hardware, software licenses, and warranty coverage are scattered across home offices and remote sites, and it is easy to lose track of what is deployed where. AssetGriffin gives IT teams a directory built with the fields IT actually needs, not a generic inventory list.',
    features: [
      {
        icon: Laptop,
        title: 'IT-specific asset fields',
        body: 'Track operating system, license assignments, and MDM enrollment status directly on each hardware asset record.',
      },
      {
        icon: CalendarClock,
        title: 'Warranty and support expiration tracking',
        body: 'Get automatic reminders before warranty or support coverage expires, instead of finding out when a repair request is denied.',
      },
      {
        icon: History,
        title: 'Check-out history per employee',
        body: 'See every device an employee currently has and has ever had, useful for onboarding, offboarding, and audits alike.',
      },
      {
        icon: Plug,
        title: 'Integration with existing IT tools',
        body: 'Connect hardware records with the identity and device management tools your IT stack already runs on.',
      },
    ],
    useCase: {
      title: 'Offboarding a remote employee\u2019s equipment',
      body: 'An IT administrator offboarding a remote employee could pull up that employee\u2019s full checkout history to see every laptop, monitor, and peripheral assigned to them, then generate a return checklist before revoking access. This is an illustrative scenario showing intended use, not a documented customer result.',
    },
    faqs: [
      {
        question: 'Can we track software license assignments alongside hardware?',
        answer:
          'Yes. License assignments and MDM enrollment status can be tracked directly on the hardware asset record they relate to.',
      },
      {
        question: 'Will we get warned before warranty coverage expires?',
        answer:
          'Yes. Warranty and support expiration tracking sends reminders ahead of the expiration date so coverage lapses do not come as a surprise.',
      },
      {
        question: 'Can we see everything a specific employee has checked out?',
        answer:
          'Yes. Check-out history is tracked per employee, showing every device currently assigned and the full history of past assignments.',
      },
      {
        question: 'Does this replace our MDM or identity provider?',
        answer:
          'No. AssetGriffin is designed to integrate alongside your existing IT tools rather than replace your MDM or identity provider.',
      },
      {
        question: 'Is our hardware and employee data secure, and who owns it?',
        answer:
          'Your hardware and checkout data belongs to your organization. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our hardware?',
        answer:
          'Yes. During import you can map existing barcode or serial numbers to each device instead of generating new tags, so hardware already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work for remote employees without office Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so remote employees and IT staff can keep checking devices in and out even on home networks.',
      },
      {
        question: 'Can we track hardware bought under different budget lines or cost centers?',
        answer:
          'Yes. You can tag hardware by cost center or purchase budget and export a report showing which budget line paid for which device.',
      },
      {
        question: 'How do we import our existing device inventory?',
        answer:
          'Bulk import brings your current spreadsheet of hardware in as a single pass, and most IT teams are checking devices out to employees within a day.',
      },
      {
        question: 'Can we run reports for offboarding or SOC 2 style audits?',
        answer:
          'Yes. Check-out history and activity logs export in a format built for offboarding checklists and internal audit review.',
      },
    ],
  },
  {
    slug: 'public-works',
    navLabel: 'Public Works',
    industryName: 'public works departments',
    ctaNoun: 'equipment',
    metaTitle: 'Public Works Asset Management Software | AssetGriffin',
    metaDescription:
      'Track municipal vehicles, heavy equipment, and infrastructure tools across crews and yards with maintenance schedules and compliance-ready reporting.',
    intro:
      'Public works departments run fleets of trucks, mowers, generators, and heavy equipment out of multiple yards, and losing track of what is where slows down everything from snow removal to pothole repair. AssetGriffin gives dispatchers and crew leads one directory for every vehicle and tool, with maintenance and location history built in.',
    features: [
      {
        icon: MapPin,
        title: 'Track equipment across yards and routes',
        body: 'See which yard, truck, or crew has a piece of equipment right now, with a full history of every transfer.',
      },
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Schedule service by hours or calendar time so plows and mowers are ready before the season needs them.',
      },
      {
        icon: FileCheck,
        title: 'Compliance-ready reporting',
        body: 'Export usage and maintenance records for budget reviews and state reporting requirements without rebuilding a report from scratch.',
      },
      {
        icon: Recycle,
        title: 'Lifecycle tracking from purchase to surplus',
        body: 'Follow an asset from acquisition through every crew assignment to its eventual surplus or disposal.',
      },
    ],
    useCase: {
      title: 'Coordinating snowplow readiness before a storm',
      body: 'A public works department could check maintenance status across its plow fleet the morning before a forecasted storm, flagging any truck overdue for service before it is dispatched. This is an illustrative scenario describing intended use, not a documented result from a specific department.',
    },
    faqs: [
      {
        question: 'Can we track equipment across multiple yards?',
        answer:
          'Yes. Every asset has a current location tied to a yard, route, or crew, updated as it moves between them.',
      },
      {
        question: 'Can maintenance be scheduled seasonally?',
        answer:
          'Yes. Preventive maintenance can be scheduled by calendar time or usage hours, so seasonal equipment like plows and mowers gets serviced ahead of the season it is needed.',
      },
      {
        question: 'Can we produce reports for budget or state review?',
        answer:
          'Yes. Usage and maintenance history export in a format built for budget reviews and state reporting requirements.',
      },
      {
        question: 'Does this track equipment through disposal or surplus?',
        answer:
          'Yes. Lifecycle tracking follows an asset from acquisition through every assignment to its eventual surplus or disposal record.',
      },
      {
        question: 'Does AssetGriffin work with our GIS or fleet management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the GIS and fleet systems public works departments already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our fleet and equipment data secure, and who owns it?',
        answer:
          'Your fleet and equipment data belongs to your department. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our trucks and equipment?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each vehicle or tool instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work for crews in yards without reliable Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so crews can keep checking equipment in and out from yards with weak signal.',
      },
      {
        question: 'Can we track equipment bought with bonds or state grant funding?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which bond or grant paid for which asset, for budget or state review.',
      },
      {
        question: 'How do we import our existing fleet and equipment list?',
        answer:
          'Bulk import brings your current spreadsheet of vehicles and equipment in as a single pass, and most departments have crews scanning within a day.',
      },
    ],
  },
  {
    slug: 'security-agencies',
    navLabel: 'Security Agencies',
    industryName: 'security agencies',
    ctaNoun: 'equipment',
    metaTitle: 'Security Agency Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track radios, vehicles, and issued gear across guards and sites with checkout logs, role-based access, and shift-based assignment history.',
    intro:
      'Security agencies issue radios, vehicles, and gear to guards across many client sites, and a shift change is exactly when equipment goes missing because nobody wrote down who took what. AssetGriffin logs checkouts by guard and site, so a supervisor can see current assignments without calling every post.',
    features: [
      {
        icon: UserCheck,
        title: 'Checkout by guard and site',
        body: 'Assign equipment to a specific guard and site, with a timestamped record for every shift handoff.',
      },
      {
        icon: Lock,
        title: 'Role-based access by client or contract',
        body: 'Keep each client\u2019s equipment and access visibility separate, even when managed from one shared account.',
      },
      {
        icon: History,
        title: 'Full assignment history',
        body: 'See every guard who has held a piece of equipment, useful for incident investigations and client reporting.',
      },
      {
        icon: FileCheck,
        title: 'Client-ready reporting',
        body: 'Export equipment assignment and custody records to share with clients who require documentation.',
      },
    ],
    useCase: {
      title: 'Tracking a radio across a multi-site guard rotation',
      body: 'A security agency running guards across several client sites could check a radio out to a guard at shift start and see immediately whether it was returned at shift end, without relying on a paper sign-out sheet. This is an illustrative scenario, not a documented result from a specific agency.',
    },
    faqs: [
      {
        question: 'Can we track equipment by shift, not just by guard?',
        answer:
          'Yes. Checkout records capture the guard, the site, and the timestamp, so a shift handoff is visible as a clear record rather than a verbal handoff.',
      },
      {
        question: 'Can we keep client equipment inventories separate?',
        answer:
          'Yes. Role-based access lets you separate visibility by client or contract while still managing everything from one account.',
      },
      {
        question: 'Can we see the full history of who has held a piece of equipment?',
        answer:
          'Yes. Every checkout and transfer is retained on the equipment record, which is useful for incident investigations.',
      },
      {
        question: 'Can we share equipment records with clients?',
        answer:
          'Yes. Assignment and custody records export in a format you can hand directly to a client that requires documentation.',
      },
      {
        question: 'Does AssetGriffin work with our guard scheduling or PSIM software?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the scheduling and monitoring systems security agencies already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our client and equipment data secure, and who owns it?',
        answer:
          'Your equipment and assignment data belongs to your agency. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our radios and gear?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work for guards at remote sites without reliable signal?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so guards can keep logging checkouts at sites with weak signal.',
      },
      {
        question: 'Can we track which equipment belongs to which client contract?',
        answer:
          'Yes. You can tag equipment by client or contract and export a report showing exactly which contract each asset is billed against.',
      },
      {
        question: 'How do we import our existing equipment inventory across sites?',
        answer:
          'Bulk import brings your current spreadsheet of radios, vehicles, and gear in as a single pass, and most agencies are checking equipment out to guards within a day.',
      },
    ],
  },
  {
    slug: 'nonprofits-charities',
    navLabel: 'Nonprofits & Charities',
    industryName: 'nonprofits and charities',
    ctaNoun: 'assets',
    metaTitle: 'Nonprofit Asset Management Software | AssetGriffin',
    metaDescription:
      'Track donated equipment, vehicles, and program assets with grant-ready reporting, free tracking for small inventories, and simple setup.',
    intro:
      'Nonprofits run programs on donated equipment and a patchwork of vehicles and gear, and grant funders increasingly want documentation of how funded assets are used and maintained. AssetGriffin gives small teams a simple directory for what they own, with reporting built for the funders who ask about it.',
    features: [
      {
        icon: DollarSign,
        title: 'Free tracking for small inventories',
        body: 'Track your first 250 assets at no cost, so budget goes to your mission instead of software.',
      },
      {
        icon: FileCheck,
        title: 'Grant-ready reporting',
        body: 'Export asset records and usage history in a format funders can review without extra formatting work.',
      },
      {
        icon: HeartHandshake,
        title: 'Track donated equipment easily',
        body: 'Log donated vehicles, equipment, and gear as they arrive, with condition notes if you need them.',
      },
      {
        icon: Smartphone,
        title: 'Phone-camera scanning',
        body: 'Volunteers and staff can check equipment in and out using their own phones, with no hardware to buy.',
      },
    ],
    useCase: {
      title: 'Documenting a donated vehicle fleet for a grant report',
      body: 'A nonprofit operating a small transportation program could pull usage and maintenance records for its donated vans directly from AssetGriffin when a funder requests a program report. This is an illustrative scenario, not a documented result from a specific organization.',
    },
    faqs: [
      {
        question: 'Is tracking really free for a small nonprofit?',
        answer:
          'Yes. Tracking is free for up to 250 assets with unlimited users on the account, which covers most small nonprofit inventories.',
      },
      {
        question: 'Can we produce reports for grant funders?',
        answer:
          'Yes. Asset records and usage history export in a format built for funder and grant reporting review.',
      },
      {
        question: 'How do we log equipment that was donated to us?',
        answer:
          'Donated vehicles, equipment, and gear can be added to the directory as they arrive, with condition notes recorded on the asset.',
      },
      {
        question: 'Do volunteers need special training to use this?',
        answer:
          'No. Checkout works from any phone camera, which is simple enough for a rotating volunteer team to use without formal training.',
      },
      {
        question: 'Does AssetGriffin work with our donor CRM or grant management software?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the donor CRM and grant tools nonprofits already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our program and donated equipment data secure, and who owns it?',
        answer:
          'Your asset and program data belongs to your organization. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our vehicles and equipment?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each asset instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work for program staff in the field without reliable signal?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so field staff can keep checking equipment in and out with weak signal.',
      },
      {
        question: 'Can we track which assets were funded by a specific restricted grant?',
        answer:
          'Yes. You can tag assets by funding source and export a report showing which restricted grant paid for which asset, ready for funder review.',
      },
      {
        question: 'How do we import our existing inventory and get started?',
        answer:
          'Bulk import brings your current spreadsheet of vehicles, equipment, and gear in as a single pass, and most small teams are checking assets in and out the same day.',
      },
    ],
  },
  {
    slug: 'churches-religious-organizations',
    navLabel: 'Churches & Religious Organizations',
    industryName: 'churches and religious organizations',
    ctaNoun: 'equipment',
    metaTitle: 'Church & Religious Organization Asset Management Software | AssetGriffin',
    metaDescription:
      'Track AV equipment, event gear, and facility assets across campuses and ministries with simple checkout, volunteer-friendly scanning, and free tracking.',
    intro:
      'Sound equipment, folding tables, and event gear move between services, ministries, and off-site events run mostly by volunteers, which makes them easy to lose and hard to track down. AssetGriffin gives volunteer teams a simple way to check gear out and back in, without asking them to learn a complicated system.',
    features: [
      {
        icon: Smartphone,
        title: 'Volunteer-friendly checkout',
        body: 'Check equipment in and out using a phone camera, simple enough for a rotating volunteer team to use without training.',
      },
      {
        icon: PackageSearch,
        title: 'Track AV and event gear',
        body: 'Keep sound equipment, tables, and event gear in one directory instead of a storage closet nobody labeled.',
      },
      {
        icon: Church,
        title: 'Track assets across campuses and ministries',
        body: 'See what equipment belongs to which campus or ministry, even when gear gets borrowed between them.',
      },
      {
        icon: DollarSign,
        title: 'Free tracking for small inventories',
        body: 'Track your first 250 assets at no cost — enough for a single congregation or a small multi-site ministry.',
      },
    ],
    useCase: {
      title: 'Keeping track of AV gear borrowed between campuses',
      body: 'A multi-site congregation could check a set of wireless microphones out to a satellite campus for a weekend event and confirm they were returned to the main campus afterward, instead of relying on a group text. This is an illustrative scenario, not a documented result from a specific organization.',
    },
    faqs: [
      {
        question: 'Do volunteers need training to check equipment in and out?',
        answer:
          'No. Checkout works from any phone camera, so a rotating volunteer team can use it without formal training.',
      },
      {
        question: 'Can we track equipment across multiple campuses?',
        answer:
          'Yes. Every asset can be assigned to a campus or ministry, and transfers between them are logged automatically.',
      },
      {
        question: 'Is this affordable for a small congregation?',
        answer:
          'Yes. Tracking is free for up to 250 assets with unlimited users, which covers most single-campus congregations.',
      },
      {
        question: 'Can we track event equipment separately from permanent facility equipment?',
        answer:
          'Yes. AV gear, event equipment, and fixed facility assets can all be tracked in the same directory with their own categories.',
      },
      {
        question: 'Does AssetGriffin work with our church management software (ChMS)?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the ChMS and giving platforms congregations already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our equipment and volunteer data secure, and who owns it?',
        answer:
          'Your equipment and checkout data belongs to your congregation. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the labels already on our AV gear and tables?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones, so gear already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work at off-site events without reliable Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so volunteers can keep checking gear in and out even at venues with weak signal.',
      },
      {
        question: 'Can we track which equipment was purchased with a specific building or missions fund?',
        answer:
          'Yes. You can tag assets by funding source and export a report showing which fund paid for which piece of equipment.',
      },
      {
        question: 'How do we import our existing equipment list and get started?',
        answer:
          'Bulk import brings your current spreadsheet of AV gear, tables, and facility equipment in as a single pass, and most congregations have volunteers checking gear out within a day.',
      },
    ],
  },
  {
    slug: 'it-consulting-msps',
    navLabel: 'IT Consulting & MSPs',
    industryName: 'IT consulting firms and MSPs',
    ctaNoun: 'client hardware',
    metaTitle: 'IT Asset Management Software for MSPs | AssetGriffin',
    metaDescription:
      'Track client hardware across accounts with separate inventories, warranty tracking, and client-ready reporting built for IT consulting firms and MSPs.',
    intro:
      'Managing hardware for multiple clients means keeping each client\u2019s inventory separate while still working from one consistent system, and most tools force a choice between the two. AssetGriffin gives MSPs and IT consulting firms a way to manage every client\u2019s equipment on its own while still working from a single dashboard.',
    features: [
      {
        icon: Users,
        title: 'Separate inventories per client',
        body: 'Keep each client\u2019s hardware inventory distinct while managing everything from one account.',
      },
      {
        icon: Laptop,
        title: 'Full device lifecycle tracking',
        body: 'Track hardware from deployment through repair to retirement for every client you support.',
      },
      {
        icon: CalendarClock,
        title: 'Warranty and support expiration tracking',
        body: 'Get reminders before a client\u2019s warranty or support contract lapses, before it becomes their emergency.',
      },
      {
        icon: FileCheck,
        title: 'Client-ready reporting',
        body: 'Export inventory and service history in a format you can hand directly to a client during a review.',
      },
    ],
    useCase: {
      title: 'Managing hardware across a dozen client accounts',
      body: 'An MSP supporting multiple small business clients could keep each client\u2019s device inventory separate while tracking warranty expirations across all of them from a single dashboard. This is an illustrative scenario, not a documented result from a specific firm.',
    },
    faqs: [
      {
        question: 'Can we keep each client\u2019s equipment inventory separate?',
        answer:
          'Yes. Each client\u2019s hardware inventory stays distinct, even though you manage all of them from one account.',
      },
      {
        question: 'Can we track a device from deployment through retirement?',
        answer:
          'Yes. Every device record follows its full lifecycle, including repairs and reassignments, from deployment through retirement.',
      },
      {
        question: 'Will we know before a client\u2019s support contract expires?',
        answer:
          'Yes. Warranty and support expiration tracking sends reminders ahead of the expiration date for each client\u2019s equipment.',
      },
      {
        question: 'Can we generate reports to share with clients?',
        answer:
          'Yes. Inventory and service history export in a format built to hand directly to a client during a review.',
      },
      {
        question: 'Does AssetGriffin work with our RMM or PSA platform?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the RMM and PSA tools MSPs already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our clients\u2019 hardware data secure, and who owns it?',
        answer:
          'Each client\u2019s hardware data belongs to that client\u2019s account. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on client hardware?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each device instead of generating new ones, so hardware already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work at client sites without reliable Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so techs can keep checking devices in and out at sites with weak signal.',
      },
      {
        question: 'Can we track which hardware is billed under which client contract?',
        answer:
          'Yes. You can tag hardware by client or contract and export a report showing exactly which contract each device is billed against.',
      },
      {
        question: 'How do we import inventory across a dozen client accounts?',
        answer:
          'Bulk import brings each client\u2019s spreadsheet in as a separate pass, keeping every client\u2019s inventory distinct while you manage all of them from one account.',
      },
    ],
  },
  {
    slug: 'energy-utilities',
    navLabel: 'Energy & Utilities',
    industryName: 'energy and utilities companies',
    ctaNoun: 'field equipment',
    metaTitle: 'Energy & Utilities Asset Management Software | AssetGriffin',
    metaDescription:
      'Track field equipment, meters, and test gear across crews and sites with maintenance scheduling, calibration history, and compliance-ready reporting.',
    intro:
      'Meters, transformers, and field test equipment move between crews and sites constantly, and a missed calibration or maintenance window can mean a compliance issue or an outage. AssetGriffin keeps maintenance and calibration history tied to the same equipment record your crews already use in the field.',
    features: [
      {
        icon: MapPin,
        title: 'Track equipment across sites and crews',
        body: 'See which crew or site currently has a piece of field equipment, with a full history of every transfer.',
      },
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Schedule inspections and service for meters, transformers, and field equipment before failures cause outages.',
      },
      {
        icon: FileCheck,
        title: 'Compliance-ready reporting',
        body: 'Export maintenance and inspection history for regulatory review without rebuilding records from field notes.',
      },
      {
        icon: History,
        title: 'Full equipment history across crews',
        body: 'See every crew and site assignment for a piece of equipment over its full lifecycle.',
      },
    ],
    useCase: {
      title: 'Checking calibration status before dispatching test equipment',
      body: 'A utility company could check which crew currently has a piece of test equipment and its last calibration date before dispatching it to a new job. This is an illustrative scenario, not a documented result from a specific company.',
    },
    faqs: [
      {
        question: 'Can we track equipment as it moves between crews and sites?',
        answer:
          'Yes. Every transfer is logged, so you can see the current location and the complete history of assignments for a piece of equipment.',
      },
      {
        question: 'Can we schedule maintenance and calibration together?',
        answer:
          'Yes. Preventive maintenance and calibration intervals can both be scheduled per asset, with reminders before service is due.',
      },
      {
        question: 'Can we produce records for a regulatory review?',
        answer:
          'Yes. Maintenance and inspection history export in a format built for regulatory and compliance review.',
      },
      {
        question: 'Does this work for both large fixed equipment and portable field gear?',
        answer:
          'Yes. Both fixed equipment and portable field gear can be tracked in the same directory, each with its own maintenance and calibration schedule.',
      },
      {
        question: 'Does AssetGriffin work with our SCADA or GIS system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the SCADA and GIS systems energy and utility companies already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our field equipment data secure, and who owns it?',
        answer:
          'Your equipment and calibration data belongs to your company. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our meters and test gear?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does this work for crews in the field without reliable signal?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so field crews can keep checking equipment in and out with weak signal.',
      },
      {
        question: 'Can we track equipment purchased under a specific capital or regulatory program?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which capital program paid for which asset, for regulatory review.',
      },
      {
        question: 'How do we import our existing equipment list and roll this out to crews?',
        answer:
          'Bulk import brings your current spreadsheet of meters, transformers, and field gear in as a single pass, and most crews are scanning equipment within a day.',
      },
    ],
  },
  {
    slug: 'transportation-logistics',
    navLabel: 'Transportation & Logistics',
    industryName: 'transportation and logistics companies',
    ctaNoun: 'fleet and cargo equipment',
    metaTitle: 'Transportation & Logistics Asset Management Software | AssetGriffin',
    metaDescription:
      'Track vehicles, trailers, and cargo equipment across routes and depots with maintenance scheduling, location history, and compliance-ready reporting.',
    intro:
      'Vehicles, trailers, and cargo equipment move across routes and depots constantly, and a missed maintenance window can turn into a breakdown mid-route. AssetGriffin schedules preventive maintenance and tracks location history for your fleet, so equipment status is a lookup instead of a phone call to dispatch.',
    features: [
      {
        icon: Truck,
        title: 'Fleet and trailer tracking',
        body: 'Track vehicles, trailers, and cargo equipment across routes and depots in one directory.',
      },
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Schedule service by mileage or calendar time so vehicles are serviced before a route depends on them.',
      },
      {
        icon: Route,
        title: 'Location history across routes',
        body: 'See where a vehicle or piece of equipment has been assigned across its full route history.',
      },
      {
        icon: FileCheck,
        title: 'Compliance-ready reporting',
        body: 'Export maintenance records for safety and regulatory compliance review.',
      },
    ],
    useCase: {
      title: 'Scheduling maintenance around a delivery route',
      body: 'A logistics company could check a trailer\u2019s maintenance status before assigning it to a long route, catching a service that was due before it caused a breakdown mid-route. This is an illustrative scenario, not a documented result from a specific company.',
    },
    faqs: [
      {
        question: 'Can we track trailers and cargo equipment, not just vehicles?',
        answer:
          'Yes. Trailers, cargo equipment, and vehicles can all be tracked in the same directory, each with its own maintenance schedule.',
      },
      {
        question: 'Can maintenance be scheduled by mileage instead of just calendar time?',
        answer:
          'Yes. Preventive maintenance can be scheduled by mileage, usage hours, or calendar time, depending on what fits the asset.',
      },
      {
        question: 'Can we see where a vehicle has been assigned over time?',
        answer:
          'Yes. Location history tracks every route and depot assignment for a vehicle or piece of equipment across its full history.',
      },
      {
        question: 'Can we produce maintenance records for a safety compliance review?',
        answer:
          'Yes. Maintenance history exports in a format built for safety and regulatory compliance review.',
      },
      {
        question: 'Does AssetGriffin work with our TMS or fleet telematics?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the TMS and telematics systems logistics companies already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our fleet and cargo equipment data secure, and who owns it?',
        answer:
          'Your fleet and equipment data belongs to your company. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our trailers and equipment?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each vehicle or trailer instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work at depots with weak Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so dispatch and drivers can keep checking equipment in and out at depots with weak signal.',
      },
      {
        question: 'Can we track fleet assets purchased under a specific capital lease or budget?',
        answer:
          'Yes. You can tag vehicles and trailers by funding source and export a report showing which capital budget or lease covers which asset.',
      },
      {
        question: 'How do we import our existing fleet list and get started?',
        answer:
          'Bulk import brings your current spreadsheet of vehicles, trailers, and cargo equipment in as a single pass, and most fleets are tracking maintenance within a day.',
      },
    ],
  },
  {
    slug: 'hospitality',
    navLabel: 'Hospitality',
    industryName: 'hotels and hospitality groups',
    ctaNoun: 'equipment and furnishings',
    metaTitle: 'Hospitality Asset Management Software | AssetGriffin',
    metaDescription:
      'Track equipment and furnishings across properties with room inventory tracking, maintenance scheduling, and asset history built for hotel groups.',
    intro:
      'Furniture, fixtures, and back-of-house equipment need to be tracked across every property in a group, and renovations or property changes make that easy to lose track of. AssetGriffin gives hospitality groups one directory for equipment and furnishings across every property, with maintenance history that survives a renovation.',
    features: [
      {
        icon: Hotel,
        title: 'Track equipment across properties',
        body: 'See what equipment and furnishings belong to which property, even across a multi-location group.',
      },
      {
        icon: BedDouble,
        title: 'Room and furnishing inventory',
        body: 'Track furniture, fixtures, and in-room equipment separately from back-of-house equipment.',
      },
      {
        icon: CalendarClock,
        title: 'Maintenance scheduling',
        body: 'Schedule preventive maintenance for kitchen, laundry, and facility equipment before it fails during a busy season.',
      },
      {
        icon: History,
        title: 'Full asset history across renovations',
        body: 'Keep a record of equipment and furnishings through renovations and property changes, not just the current state.',
      },
    ],
    useCase: {
      title: 'Tracking furniture inventory during a property renovation',
      body: 'A hotel group renovating one property could track which furniture and equipment moved to storage versus another property, instead of losing count during the move. This is an illustrative scenario, not a documented result from a specific group.',
    },
    faqs: [
      {
        question: 'Can we track equipment across multiple properties?',
        answer:
          'Yes. Every asset is assigned to a property, and transfers between properties are logged automatically.',
      },
      {
        question: 'Can we track room furnishings separately from back-of-house equipment?',
        answer:
          'Yes. In-room furniture and fixtures can be tracked as their own category, separate from kitchen, laundry, and facility equipment.',
      },
      {
        question: 'Does maintenance scheduling cover kitchen and laundry equipment?',
        answer:
          'Yes. Preventive maintenance can be scheduled for any equipment category, including kitchen and laundry equipment, ahead of your busy season.',
      },
      {
        question: 'What happens to asset records during a renovation?',
        answer:
          'Asset history is retained through renovations and property changes, so you keep a record of what moved where instead of losing track during the transition.',
      },
      {
        question: 'Does AssetGriffin work with our property management system (PMS)?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the PMS and facilities systems hotel groups already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our property and furnishings data secure, and who owns it?',
        answer:
          'Your equipment and furnishings data belongs to your group. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our equipment and furniture?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work in back-of-house areas with weak Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so staff can keep checking equipment in and out in storage areas with weak signal.',
      },
      {
        question: 'Can we track furnishings and equipment purchased under a renovation capital budget?',
        answer:
          'Yes. You can tag assets by funding source and export a report showing which capital budget paid for which piece of equipment or furnishing.',
      },
      {
        question: 'How do we import our existing property inventory?',
        answer:
          'Bulk import brings each property\u2019s spreadsheet of equipment and furnishings in as a single pass, and staff can start checking items in and out within a day.',
      },
    ],
  },
  {
    slug: 'warehousing-distribution',
    navLabel: 'Warehousing & Distribution',
    industryName: 'warehousing and distribution operations',
    ctaNoun: 'equipment',
    metaTitle: 'Warehousing & Distribution Asset Management Software | AssetGriffin',
    metaDescription:
      'Track forklifts, material handling equipment, and inventory across facilities with maintenance scheduling and barcode scanning built for the floor.',
    intro:
      'Forklifts and material handling equipment move between facilities and shifts constantly, and unplanned downtime on the floor is expensive. AssetGriffin tracks equipment location and maintenance history across every facility, with scanning that works from any phone already on the floor.',
    features: [
      {
        icon: Warehouse,
        title: 'Track equipment across facilities',
        body: 'See where forklifts, pallet jacks, and material handling equipment are assigned across multiple facilities.',
      },
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Schedule service for material handling equipment by hours or calendar time to avoid downtime on the floor.',
      },
      {
        icon: PackageSearch,
        title: 'Inventory and fixed asset tracking together',
        body: 'Manage racking, equipment, and consumable supplies in the same system instead of separate spreadsheets.',
      },
      {
        icon: ScanLine,
        title: 'Barcode scanning on the floor',
        body: 'Scan equipment and inventory from any phone on the warehouse floor to log checkouts and transfers in real time.',
      },
    ],
    useCase: {
      title: 'Locating a forklift across a multi-facility operation',
      body: 'A distribution operation running several facilities could check which facility currently has a specific forklift assigned before renting another one. This is an illustrative scenario, not a documented result from a specific operation.',
    },
    faqs: [
      {
        question: 'Can we track equipment across multiple facilities?',
        answer:
          'Yes. Every asset has a current facility assignment, updated automatically as equipment moves between locations.',
      },
      {
        question: 'Can maintenance be scheduled by usage hours for material handling equipment?',
        answer:
          'Yes. Preventive maintenance can be scheduled by usage hours or calendar time, whichever fits the equipment.',
      },
      {
        question: 'Can we track consumable inventory alongside fixed equipment?',
        answer:
          'Yes. Consumable stock and fixed equipment can both be tracked in the same directory rather than in separate systems.',
      },
      {
        question: 'Do we need dedicated barcode scanners on the floor?',
        answer:
          'No. Any phone camera already on the floor can scan barcode tags to log checkouts and transfers in real time.',
      },
      {
        question: 'Does AssetGriffin work with our WMS?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the warehouse management system your facility already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our equipment and facility data secure, and who owns it?',
        answer:
          'Your equipment and inventory data belongs to your operation. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'Can we keep the asset tags already on our forklifts and equipment?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones, so equipment already labeled does not need to be re-tagged.',
      },
      {
        question: 'Does scanning work in areas of the warehouse with weak Wi-Fi?',
        answer:
          'Scans are designed to sync as soon as a connection is available, so floor staff can keep checking equipment in and out even with weak signal.',
      },
      {
        question: 'Can we track equipment purchased under a specific capital budget?',
        answer:
          'Yes. You can tag equipment by funding source and export a report showing which capital budget paid for which piece of equipment.',
      },
      {
        question: 'How do we import our existing equipment list across facilities?',
        answer:
          'Bulk import brings each facility\u2019s spreadsheet of equipment in as a single pass, and floor staff can start scanning within a day.',
      },
    ],
  },
]

export function getIndustryBySlug(slug: string): IndustryPage | undefined {
  return industries.find((industry) => industry.slug === slug)
}
