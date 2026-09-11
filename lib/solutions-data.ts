import {
  Search,
  MapPin,
  Boxes,
  History,
  Layers,
  LineChart,
  Recycle,
  BarChart3,
  ListChecks,
  Repeat,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  Filter,
  FileDown,
  Lock,
  Laptop,
  QrCode,
  Users,
  RefreshCcw,
  PackageSearch,
  ArrowLeftRight,
  ClipboardList,
  Building2,
  Landmark,
  ScanLine,
  Wrench,
  UserCheck,
  Hammer,
  Truck,
  AlertTriangle,
  ScrollText,
  Gauge,
  CalendarClock,
  ClipboardCheck,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { FaqItem } from '@/components/marketing/faq-accordion'

export interface SolutionFeature {
  icon: LucideIcon
  title: string
  body: string
}

export interface SolutionAudience {
  title: string
  body: string
}

export interface SolutionPage {
  slug: string
  navLabel: string
  navGroup: 'capability' | 'highlight'
  capabilityName: string
  eyebrow: string
  metaTitle: string
  metaDescription: string
  intro: string
  features: SolutionFeature[]
  audiences: SolutionAudience[]
  ctaHeadline: string
  faqs: FaqItem[]
}

export const solutions: SolutionPage[] = [
  {
    slug: 'asset-tracking',
    navLabel: 'Asset Tracking Software',
    navGroup: 'capability',
    capabilityName: 'Asset tracking software',
    eyebrow: 'Solutions · Asset Tracking',
    metaTitle: 'Asset Tracking Software | AssetGriffin',
    metaDescription:
      'Track every asset, its location, its custodian, and its full history in one searchable directory. Built to stay fast past 10,000+ assets.',
    intro:
      'Asset tracking answers one question fast: where is this thing right now, and who has it. AssetGriffin replaces spreadsheets and sticky notes with a single searchable directory that stays fast whether you have 200 assets or 200,000, so anyone on your team can find an item in seconds instead of asking around.',
    features: [
      {
        icon: Search,
        title: 'Search that scales',
        body: 'Find any asset by name, tag, serial number, or custodian in under a second, no matter how large your inventory grows.',
      },
      {
        icon: MapPin,
        title: 'Always know where things are',
        body: 'Every asset carries a live location and status, updated automatically as it moves between sites, rooms, and people.',
      },
      {
        icon: Boxes,
        title: 'One directory, not five spreadsheets',
        body: 'Consolidate equipment, IT hardware, and furniture into a single source of truth your whole team can trust.',
      },
      {
        icon: History,
        title: 'Full history on every item',
        body: 'See every checkout, transfer, repair, and status change for an asset from the day it was added to today.',
      },
    ],
    audiences: [
      {
        title: 'Operations teams',
        body: 'Need to know what equipment exists and where it currently sits, without a manual count.',
      },
      {
        title: 'Field crews',
        body: 'Check assets in and out from a phone on-site, instead of paperwork that gets filed days later.',
      },
      {
        title: 'Front-office and IT staff',
        body: 'Answer "who has this" questions in seconds instead of digging through email threads.',
      },
      {
        title: 'Growing teams outgrowing spreadsheets',
        body: 'Move off a shared spreadsheet before it becomes unreliable at a few hundred rows.',
      },
    ],
    ctaHeadline: 'Start tracking your assets in minutes',
    faqs: [
      {
        question: 'How is asset tracking different from asset management?',
        answer:
          'Asset tracking focuses on location and custody — knowing where an asset is and who has it right now. Asset management adds the full lifecycle layer on top: procurement, depreciation, and end-of-life planning.',
      },
      {
        question: 'How many assets can AssetGriffin handle?',
        answer:
          'Search and lookups are built to stay fast well past 10,000 assets, so performance does not degrade as your inventory grows.',
      },
      {
        question: 'Do we need barcode scanners?',
        answer:
          'No. Any phone camera can scan an asset tag to log a checkout or transfer, so there is no dedicated scanning hardware to buy.',
      },
      {
        question: 'Can we import our existing spreadsheet?',
        answer:
          'Yes. Bulk import brings your current inventory in as a single pass, so you are not entering assets one at a time.',
      },
    ],
  },
  {
    slug: 'asset-management',
    navLabel: 'Asset Management Software',
    navGroup: 'capability',
    capabilityName: 'Asset management software',
    eyebrow: 'Solutions · Asset Management',
    metaTitle: 'Asset Management Software | AssetGriffin',
    metaDescription:
      'Manage the full asset lifecycle — procurement through disposal — with depreciation tracking, utilization reporting, and cross-department oversight.',
    intro:
      'Asset management is the layer above tracking: it is the full lifecycle view of every asset from the day it is purchased to the day it is retired, including what it cost, how it has depreciated, and how well it is being used. AssetGriffin gives finance, operations, and department leads a shared view of that lifecycle instead of separate spreadsheets that never quite agree.',
    features: [
      {
        icon: Layers,
        title: 'Full lifecycle view',
        body: 'Follow an asset from procurement through every assignment, repair, and transfer to its eventual disposal.',
      },
      {
        icon: LineChart,
        title: 'Depreciation tracking',
        body: 'Track book value alongside location and custody, so finance and operations are always working from the same numbers.',
      },
      {
        icon: BarChart3,
        title: 'Utilization reporting',
        body: 'See which assets are heavily used and which are sitting idle, to make smarter purchasing and reallocation decisions.',
      },
      {
        icon: Recycle,
        title: 'Cross-department oversight',
        body: 'Give administrators a view across every department while department leads manage only what belongs to them.',
      },
    ],
    audiences: [
      {
        title: 'Finance and procurement teams',
        body: 'Need depreciation and total cost of ownership data tied to the same record operations uses day to day.',
      },
      {
        title: 'Multi-department organizations',
        body: 'Want department-level ownership of assets with a single administrative view across the whole organization.',
      },
      {
        title: 'Operations leaders',
        body: 'Making capital planning decisions and need utilization data, not just a location list.',
      },
      {
        title: 'Teams planning for asset end-of-life',
        body: 'Need a documented disposal process instead of assets quietly disappearing off the books.',
      },
    ],
    ctaHeadline: 'Bring your full asset lifecycle into one system',
    faqs: [
      {
        question: 'How is this different from your Asset Tracking Software page?',
        answer:
          'Asset tracking is about location and custody in the moment. Asset management builds on that with the full lifecycle: acquisition cost, depreciation, utilization, and disposal — the view finance and leadership need, not just operations.',
      },
      {
        question: 'Can we track depreciation without a separate finance system?',
        answer:
          'Yes. Depreciation tracking lives on the same asset record as location and maintenance history, so you are not reconciling two systems.',
      },
      {
        question: 'Can different departments manage their assets independently?',
        answer:
          'Yes. Department-level permissions let each department manage its own equipment while administrators retain a cross-department view.',
      },
      {
        question: 'Does AssetGriffin help us decide when to retire an asset?',
        answer:
          'Utilization and maintenance history give you the data to make that call, and lifecycle tracking documents the disposal once you do.',
      },
    ],
  },
  {
    slug: 'inspection-management',
    navLabel: 'Inspection Management Software',
    navGroup: 'highlight',
    capabilityName: 'Inspection management software',
    eyebrow: 'Solutions · Inspections',
    metaTitle: 'Inspection Management Software | AssetGriffin',
    metaDescription:
      'Run recurring pass/fail inspections on any asset with custom checklist templates, automatic maintenance tickets, and a full inspection history.',
    intro:
      'A skipped inspection is invisible until the equipment it was supposed to catch fails. AssetGriffin turns inspections into a scheduled, checklist-driven workflow tied directly to the asset record, so a failed item automatically becomes a maintenance task instead of a note someone forgets to follow up on.',
    features: [
      {
        icon: ListChecks,
        title: 'Custom checklist templates per asset category',
        body: 'Build a different checklist for forklifts, laptops, or fire extinguishers, matched to what actually needs checking on each.',
      },
      {
        icon: Repeat,
        title: 'Recurring scheduling',
        body: 'Schedule inspections daily, weekly, or per-use, so nothing depends on someone remembering to run it manually.',
      },
      {
        icon: CheckCircle2,
        title: 'Pass/fail history per asset',
        body: 'See every inspection result for an asset over time, not just the most recent one.',
      },
      {
        icon: Ticket,
        title: 'Automatic maintenance ticket creation',
        body: 'A failed inspection item automatically opens a maintenance task, so issues get tracked instead of forgotten.',
      },
    ],
    audiences: [
      {
        title: 'Safety and compliance officers',
        body: 'Need documented proof that required inspections actually happened, on schedule.',
      },
      {
        title: 'Fleet and equipment managers',
        body: 'Run recurring safety checks on vehicles and heavy equipment without manual tracking.',
      },
      {
        title: 'Facilities teams',
        body: 'Inspect fire safety and life-safety equipment on a fixed schedule with a documented history.',
      },
      {
        title: 'Maintenance teams',
        body: 'Want failed inspections to turn into work orders automatically, not a separate email.',
      },
    ],
    ctaHeadline: 'Put your inspections on a schedule that runs itself',
    faqs: [
      {
        question: 'Can we build different checklists for different asset types?',
        answer:
          'Yes. Checklist templates are built per asset category, so a forklift inspection and a laptop inspection can ask entirely different questions.',
      },
      {
        question: 'What happens when an inspection item fails?',
        answer:
          'A failed item automatically opens a maintenance task tied to that asset, so the issue is tracked without a separate manual step.',
      },
      {
        question: 'Can inspections run more often than daily?',
        answer:
          'Yes. Inspections can be scheduled per-use in addition to daily or weekly, depending on how the asset is used.',
      },
      {
        question: 'Can we see inspection history over time for a single asset?',
        answer:
          'Yes. Every inspection result is stored against the asset, so you can review its full pass/fail history, not just the latest check.',
      },
    ],
  },
  {
    slug: 'audit-trail-compliance',
    navLabel: 'Audit Trail & Compliance Software',
    navGroup: 'highlight',
    capabilityName: 'Audit trail and compliance software',
    eyebrow: 'Solutions · Audit Trail & Compliance',
    metaTitle: 'Audit Trail & Compliance Software | AssetGriffin',
    metaDescription:
      'An immutable activity log with user attribution, filterable by user, action, date, or asset, and exportable into audit-ready reports.',
    intro:
      'When a compliance review asks who touched a piece of equipment and when, "we\u2019re not sure" is not an acceptable answer. AssetGriffin logs every action against every asset permanently, with the user who performed it, so producing an audit-ready report is an export, not a reconstruction project.',
    features: [
      {
        icon: History,
        title: 'Immutable activity log with user attribution',
        body: 'Every checkout, transfer, edit, and status change is permanently recorded with the user who performed it.',
      },
      {
        icon: Filter,
        title: 'Filterable by user, action, date, or asset',
        body: 'Narrow the activity log down to exactly the slice a reviewer is asking about, in seconds.',
      },
      {
        icon: FileDown,
        title: 'Exportable audit-ready reports',
        body: 'Generate a clean export of activity and custody history in a format built for handing to an auditor or regulator.',
      },
      {
        icon: Lock,
        title: 'Role-based access controls',
        body: 'Restrict who can view or edit sensitive asset records, and have that restriction itself be part of the auditable record.',
      },
    ],
    audiences: [
      {
        title: 'Compliance and audit teams',
        body: 'Need a defensible, tamper-proof record of custody and activity for regulated equipment.',
      },
      {
        title: 'Government and public-sector agencies',
        body: 'Face public accountability requirements for taxpayer-funded equipment.',
      },
      {
        title: 'Healthcare organizations',
        body: 'Must document chain-of-custody and maintenance history for regulatory review.',
      },
      {
        title: 'IT and security teams',
        body: 'Need to prove exactly who had access to a device at any point in time.',
      },
    ],
    ctaHeadline: 'Make your next audit a report export, not a scramble',
    faqs: [
      {
        question: 'Can the audit log be edited or deleted?',
        answer:
          'No. The activity log is immutable by design — entries cannot be altered or removed, which is what makes it usable as an audit record.',
      },
      {
        question: 'Can we filter the log down to a specific date range or asset?',
        answer:
          'Yes. The log can be filtered by user, action type, date range, or a specific asset, so you can pull exactly what a reviewer is asking for.',
      },
      {
        question: 'What format do exported reports come in?',
        answer:
          'Reports export in a clean, audit-ready format designed to be handed directly to a reviewer, auditor, or regulator.',
      },
      {
        question: 'Is this a certified compliance product for our industry?',
        answer:
          'AssetGriffin provides the underlying audit trail and access controls many compliance programs rely on, but it is not a certified or validated compliance product on its own — confirm it meets your specific regulatory requirements before depending on it for certification purposes.',
      },
    ],
  },
  {
    slug: 'it-asset-management',
    navLabel: 'IT Asset Management',
    navGroup: 'capability',
    capabilityName: 'IT asset management software',
    eyebrow: 'Solutions · IT Asset Management',
    metaTitle: 'IT Asset Management Software | AssetGriffin',
    metaDescription:
      'Track every laptop, monitor, and device from purchase to retirement, with assignment history, warranty tracking, and offboarding checklists built in.',
    intro:
      'IT hardware is the asset category that moves the most and disappears the most easily. AssetGriffin gives IT teams a single record for every device — who has it, what warranty it carries, and what happened to it before — so offboarding a laptop is a lookup instead of a scavenger hunt.',
    features: [
      {
        icon: Laptop,
        title: 'A record for every device',
        body: 'Laptops, monitors, phones, and peripherals all live in one directory with serial numbers, specs, and current assignee.',
      },
      {
        icon: UserCheck,
        title: 'Assignment history per employee',
        body: 'See every device a person has ever been issued, so offboarding means checking one list instead of asking around.',
      },
      {
        icon: ShieldCheck,
        title: 'Warranty and support tracking',
        body: 'Know which devices are still under warranty before you pay out of pocket for a repair that should be covered.',
      },
      {
        icon: Ticket,
        title: 'Repair and replacement history',
        body: 'Every service event stays attached to the device, so a laptop with three failed repairs is easy to spot before a fourth.',
      },
    ],
    audiences: [
      {
        title: 'IT administrators',
        body: 'Manage device assignment and lifecycle across a growing headcount without a shared spreadsheet.',
      },
      {
        title: 'HR and onboarding teams',
        body: 'Need to know what equipment a new hire should receive and confirm a leaving employee returned everything.',
      },
      {
        title: 'IT teams supporting multiple offices',
        body: 'Track hardware across locations without losing track of which office actually has a given device.',
      },
      {
        title: 'MSPs managing client hardware',
        body: 'Keep each client\u2019s device inventory separate while working from one consistent system.',
      },
    ],
    ctaHeadline: 'Never lose track of another laptop',
    faqs: [
      {
        question: 'Can we track warranty expiration dates?',
        answer:
          'Yes. Warranty information lives on the device record, so you can see coverage status before deciding whether to repair or replace.',
      },
      {
        question: 'How does offboarding work?',
        answer:
          'Every device ever assigned to an employee is visible on their history, so confirming a full equipment return during offboarding is a single lookup.',
      },
      {
        question: 'Can we track more than laptops?',
        answer:
          'Yes. Monitors, phones, docking stations, and any other IT peripheral can be tracked the same way as laptops and desktops.',
      },
      {
        question: 'Does this replace our MDM software?',
        answer:
          'No. AssetGriffin tracks physical custody, assignment, and lifecycle — it complements device management software rather than replacing remote configuration and security policy tools.',
      },
    ],
  },
  {
    slug: 'inventory-management',
    navLabel: 'Inventory Management',
    navGroup: 'capability',
    capabilityName: 'Inventory management software',
    eyebrow: 'Solutions · Inventory Management',
    metaTitle: 'Inventory Management Software | AssetGriffin',
    metaDescription:
      'Track stock levels, consumable supplies, and reorder points alongside your fixed assets, with low-stock alerts and usage history in one place.',
    intro:
      'Fixed assets and consumable inventory usually end up split across two different systems, which means nobody has the full picture. AssetGriffin tracks stock levels and reorder points for supplies right alongside your tracked equipment, so a single search covers both what you own and what you are running low on.',
    features: [
      {
        icon: PackageSearch,
        title: 'Stock levels at a glance',
        body: 'See current quantity on hand for every consumable item without a physical count.',
      },
      {
        icon: Bell,
        title: 'Low-stock alerts',
        body: 'Set a reorder point per item and get notified before supplies run out, not after.',
      },
      {
        icon: ArrowLeftRight,
        title: 'Usage tracking by location or team',
        body: 'See which sites or departments are consuming stock fastest to plan purchasing more accurately.',
      },
      {
        icon: Boxes,
        title: 'One system for stock and fixed assets',
        body: 'Manage consumable supplies in the same place as tracked equipment instead of maintaining two separate tools.',
      },
    ],
    audiences: [
      {
        title: 'Operations and facilities teams',
        body: 'Manage consumable supplies alongside the equipment those supplies support.',
      },
      {
        title: 'Multi-location businesses',
        body: 'Need visibility into stock levels across several sites without calling each one.',
      },
      {
        title: 'Warehouse and distribution teams',
        body: 'Track quantities on hand and where they physically sit within a facility.',
      },
      {
        title: 'Teams tired of manual reorder tracking',
        body: 'Want an alert before supplies run out instead of finding out from an empty shelf.',
      },
    ],
    ctaHeadline: 'Stop finding out you\u2019re out of stock the hard way',
    faqs: [
      {
        question: 'Can we track both consumables and fixed assets in the same system?',
        answer:
          'Yes. Consumable stock and serialized fixed assets live in the same directory, so one search covers both.',
      },
      {
        question: 'How do low-stock alerts work?',
        answer:
          'Set a reorder point per item, and AssetGriffin notifies the right person automatically once quantity on hand drops below it.',
      },
      {
        question: 'Can we track inventory across multiple warehouses or sites?',
        answer:
          'Yes. Stock is tracked per location, so you can see quantities at each site rather than a single combined total.',
      },
      {
        question: 'Is this a full warehouse management system?',
        answer:
          'No. AssetGriffin covers stock tracking, reorder alerts, and usage history well, but it is not a replacement for a dedicated WMS with picking and pallet-level logistics.',
      },
    ],
  },
  {
    slug: 'fixed-asset-tracking',
    navLabel: 'Fixed Asset Tracking',
    navGroup: 'capability',
    capabilityName: 'Fixed asset tracking software',
    eyebrow: 'Solutions · Fixed Asset Tracking',
    metaTitle: 'Fixed Asset Tracking Software | AssetGriffin',
    metaDescription:
      'Track fixed assets by location, department, and cost center, with barcode tagging and reconciliation reports built for annual physical audits.',
    intro:
      'Fixed assets sit on the books for years, which is exactly long enough for the paper trail to drift from reality. AssetGriffin ties every fixed asset to a barcode tag, a location, and a cost center, so your annual physical audit is a matter of scanning and reconciling instead of hunting room by room.',
    features: [
      {
        icon: ScanLine,
        title: 'Barcode tagging built in',
        body: 'Print and apply barcode tags per asset, then scan with any phone to confirm location during an audit.',
      },
      {
        icon: Building2,
        title: 'Track by location and cost center',
        body: 'Assign every fixed asset to a physical location and a cost center for accurate departmental reporting.',
      },
      {
        icon: ClipboardCheck,
        title: 'Reconciliation reports for physical audits',
        body: 'Compare what your records say against what you actually scan, and see discrepancies flagged automatically.',
      },
      {
        icon: LineChart,
        title: 'Book value alongside location',
        body: 'Keep acquisition cost and depreciation on the same record as physical location, so finance and facilities agree.',
      },
    ],
    audiences: [
      {
        title: 'Finance and accounting teams',
        body: 'Run an annual fixed asset audit and need it to reconcile cleanly against the general ledger.',
      },
      {
        title: 'Facilities and operations managers',
        body: 'Are responsible for knowing where fixed assets physically sit across a building or campus.',
      },
      {
        title: 'Organizations with cost-center reporting',
        body: 'Need fixed asset costs allocated accurately across departments.',
      },
      {
        title: 'Teams doing their first real physical audit',
        body: 'Are moving off a spreadsheet-based fixed asset register that has not been reconciled in years.',
      },
    ],
    ctaHeadline: 'Make your next fixed asset audit a scan, not a scavenger hunt',
    faqs: [
      {
        question: 'Do we need special barcode scanning hardware?',
        answer:
          'No. Any phone camera can scan an AssetGriffin barcode tag, so there is no dedicated scanner to purchase for an audit.',
      },
      {
        question: 'Can we assign assets to cost centers for accounting purposes?',
        answer:
          'Yes. Every fixed asset can be tagged with a cost center and department, which flows into reporting for finance.',
      },
      {
        question: 'How does the reconciliation report work?',
        answer:
          'During a physical audit, scanned assets are compared against your existing records automatically, and anything missing or unexpected is flagged for review.',
      },
      {
        question: 'Can this replace our general ledger fixed asset module?',
        answer:
          'AssetGriffin tracks physical location, tagging, and depreciation for reconciliation purposes, but it is meant to feed your accounting system, not replace your GL.',
      },
    ],
  },
  {
    slug: 'tool-tracking',
    navLabel: 'Tool Tracking Software',
    navGroup: 'capability',
    capabilityName: 'Tool tracking software',
    eyebrow: 'Solutions · Tool Tracking',
    metaTitle: 'Tool Tracking Software | AssetGriffin',
    metaDescription:
      'Track hand tools and power tools by crew and job site, with checkout logs from a phone and full history on every tool your team owns.',
    intro:
      'Tools walk off job sites in the truck of whoever borrowed them last, and most crews only find out when they need that tool for the next job. AssetGriffin logs a checkout the moment a tool leaves the truck or the shop, so a crew lead can see exactly who has what, at which site, without a paper sign-out sheet.',
    features: [
      {
        icon: Hammer,
        title: 'Checkout by crew and job site',
        body: 'Log which crew took a tool and to which job site, so tools are traceable across every project, not just the shop.',
      },
      {
        icon: QrCode,
        title: 'Scan from any phone, no hardware to buy',
        body: 'Crew members scan a tool tag from a phone camera to check a tool in or out in the field.',
      },
      {
        icon: History,
        title: 'Full history on every tool',
        body: 'See who has had a tool, at which job, going back to the day it was purchased.',
      },
      {
        icon: Wrench,
        title: 'Maintenance history alongside checkout',
        body: 'Track repairs and servicing on the same record as checkout history, so a tool overdue for maintenance is easy to catch.',
      },
    ],
    audiences: [
      {
        title: 'Construction and trade crews',
        body: 'Move tools between job sites constantly and need to know where each one currently is.',
      },
      {
        title: 'Tool room and shop managers',
        body: 'Are responsible for a shared tool inventory that multiple crews check out from.',
      },
      {
        title: 'Field supervisors',
        body: 'Need to confirm tools returned to the shop at the end of a job, not left at the site.',
      },
      {
        title: 'Companies losing tools to job-site turnover',
        body: 'Are tired of replacing tools that quietly disappeared between crews.',
      },
    ],
    ctaHeadline: 'Know which crew has which tool, every time',
    faqs: [
      {
        question: 'Can crew members check tools in and out from the field?',
        answer:
          'Yes. Checkout happens from any phone camera scanning a tool tag, so it works on a job site without extra hardware.',
      },
      {
        question: 'Can we track which job site a tool is currently at?',
        answer:
          'Yes. Every checkout records the destination job site, so you can see not just who has a tool but where it physically is.',
      },
      {
        question: 'What happens if a tool is never returned?',
        answer:
          'Overdue checkouts remain visible on the tool\u2019s record, so a tool that never came back stays flagged instead of quietly falling off the list.',
      },
      {
        question: 'Can we track tool maintenance too?',
        answer:
          'Yes. Maintenance and repair events live on the same tool record as checkout history.',
      },
    ],
  },
  {
    slug: 'equipment-tracking',
    navLabel: 'Equipment Tracking Software',
    navGroup: 'capability',
    capabilityName: 'Equipment tracking software',
    eyebrow: 'Solutions · Equipment Tracking',
    metaTitle: 'Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track heavy equipment and machinery by location, operator, and utilization, with maintenance history and downtime visibility built in.',
    intro:
      'Heavy equipment is expensive enough that idle time and unplanned downtime are real costs, not rounding errors. AssetGriffin tracks utilization and maintenance history for every piece of equipment, so you can see which machines are earning their keep and which ones are quietly sitting idle at a job site.',
    features: [
      {
        icon: Gauge,
        title: 'Utilization tracking',
        body: 'See how much a piece of equipment is actually used, to inform rental-versus-buy and reallocation decisions.',
      },
      {
        icon: MapPin,
        title: 'Location by site',
        body: 'Know which job site or yard a piece of equipment is currently assigned to at any moment.',
      },
      {
        icon: Wrench,
        title: 'Maintenance history and scheduling',
        body: 'Track service intervals and repair history on heavy equipment the same way you would a vehicle fleet.',
      },
      {
        icon: AlertTriangle,
        title: 'Downtime visibility',
        body: 'See when equipment goes down for repair and for how long, to spot patterns before they become expensive.',
      },
    ],
    audiences: [
      {
        title: 'Construction and heavy equipment fleets',
        body: 'Manage excavators, generators, and other machinery across multiple active job sites.',
      },
      {
        title: 'Equipment rental coordinators',
        body: 'Need to know what is available, what is out, and what is due back before renting more.',
      },
      {
        title: 'Maintenance managers',
        body: 'Track service schedules for expensive machinery to avoid breakdowns during a job.',
      },
      {
        title: 'Operations leaders evaluating fleet size',
        body: 'Need utilization data to decide whether to buy more equipment or better use what they have.',
      },
    ],
    ctaHeadline: 'See which equipment is earning its keep',
    faqs: [
      {
        question: 'Can we track which job site equipment is currently at?',
        answer:
          'Yes. Every piece of equipment has a current location tied to a job site or yard, updated as it moves.',
      },
      {
        question: 'Does this help with maintenance scheduling?',
        answer:
          'Yes. Service intervals and repair history live on the equipment record, so upcoming maintenance is visible before it becomes overdue.',
      },
      {
        question: 'Can we see utilization data to decide on rentals versus purchases?',
        answer:
          'Yes. Utilization tracking shows how much a piece of equipment is actually used, which is useful input for rent-versus-buy decisions.',
      },
      {
        question: 'Is this built for vehicles specifically, or all heavy equipment?',
        answer:
          'It covers heavy equipment and machinery broadly \u2014 excavators, generators, compressors, and similar assets \u2014 not just road vehicles.',
      },
    ],
  },
  {
    slug: 'maintenance-management',
    navLabel: 'Maintenance Management Software',
    navGroup: 'capability',
    capabilityName: 'Maintenance management software',
    eyebrow: 'Solutions · Maintenance Management',
    metaTitle: 'Maintenance Management Software | AssetGriffin',
    metaDescription:
      'Schedule preventive maintenance, track work orders, and see repair history for every asset, so equipment failures stop catching your team by surprise.',
    intro:
      'Reactive maintenance always costs more than preventive maintenance, but only if someone remembers to schedule the preventive part. AssetGriffin schedules recurring maintenance automatically and turns every repair into a tracked work order tied to the asset, so your maintenance history is a complete record instead of scattered notes.',
    features: [
      {
        icon: CalendarClock,
        title: 'Preventive maintenance scheduling',
        body: 'Set recurring maintenance intervals per asset so servicing happens on schedule, not when something breaks.',
      },
      {
        icon: ScrollText,
        title: 'Work order tracking',
        body: 'Every repair becomes a work order with status, assigned technician, and notes, tied directly to the asset.',
      },
      {
        icon: History,
        title: 'Complete repair history per asset',
        body: 'See every maintenance event an asset has ever had, so a pattern of recurring failures is easy to spot.',
      },
      {
        icon: RefreshCcw,
        title: 'Ties directly into inspections',
        body: 'A failed inspection item can open a maintenance work order automatically, connecting the two workflows instead of separating them.',
      },
    ],
    audiences: [
      {
        title: 'Maintenance and facilities teams',
        body: 'Manage preventive schedules and reactive work orders across a large equipment base.',
      },
      {
        title: 'Fleet and equipment managers',
        body: 'Need service intervals tracked automatically instead of relying on memory or a wall calendar.',
      },
      {
        title: 'Operations leaders reducing downtime',
        body: 'Want to shift from reactive repairs to a documented preventive maintenance program.',
      },
      {
        title: 'Teams already using AssetGriffin inspections',
        body: 'Want failed inspection items to flow directly into a maintenance queue.',
      },
    ],
    ctaHeadline: 'Move from reactive repairs to a maintenance schedule that runs itself',
    faqs: [
      {
        question: 'How does preventive maintenance scheduling work?',
        answer:
          'Set a recurring interval per asset \u2014 daily, weekly, monthly, or a custom cycle \u2014 and AssetGriffin creates the maintenance task automatically when it is due.',
      },
      {
        question: 'What is a work order in AssetGriffin?',
        answer:
          'A work order is a tracked repair or service task tied to a specific asset, with a status, assigned technician, and a permanent record once complete.',
      },
      {
        question: 'Does this connect to the inspection feature?',
        answer:
          'Yes. A failed inspection item can automatically generate a maintenance work order, so the two workflows are linked rather than separate systems.',
      },
      {
        question: 'Can we see maintenance costs over time?',
        answer:
          'Repair and service events are tracked per asset, giving you a history to evaluate whether an asset is becoming too costly to keep maintaining.',
      },
    ],
  },
]

export function getSolutionBySlug(slug: string): SolutionPage | undefined {
  return solutions.find((solution) => solution.slug === slug)
}
