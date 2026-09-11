import type { FaqItem } from '@/components/marketing/faq-accordion'
import type { ProductPreviewScreen } from '@/components/marketing/product-preview'
import type {
  FlexiblePoint,
  SolutionPreview,
  SolutionSection,
  StatusCard,
} from '@/components/marketing/templates/flagship-vertical-template'
import type { FunctionalCapabilitySection } from '@/components/marketing/templates/sub-vertical-template'

export interface FlagshipSubVertical {
  template: 'flagship'
  group: string
  slug: string
  navLabel: string
  parentLabel: string
  parentHref: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  headline: string
  subhead: string
  statusCards: StatusCard[]
  challengeBullets: string[]
  challengeBody: string
  solutionSections: SolutionSection[]
  solutionPreviews: SolutionPreview[]
  flexiblePreviewScreen: ProductPreviewScreen
  flexiblePoints: FlexiblePoint[]
  faqs: FaqItem[]
  ctaHeadline: string
}

export interface FunctionalSubVertical {
  template: 'functional'
  group: string
  slug: string
  navLabel: string
  parentLabel: string
  parentHref: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  subtitle: string
  hookParagraphs: string[]
  heroPreviewScreen: ProductPreviewScreen
  heroPreviewCaption?: string
  capabilitySections: FunctionalCapabilitySection[]
  faqs: FaqItem[]
  ctaHeadline: string
}

export type SubVertical = FlagshipSubVertical | FunctionalSubVertical

export const subVerticals: SubVertical[] = [
  // ---------- Fire departments (flagship) ----------
  {
    template: 'flagship',
    group: 'public-sector',
    slug: 'fire-departments',
    navLabel: 'Fire Departments',
    parentLabel: 'Public Sector',
    parentHref: '/industries/government',
    metaTitle: 'Fire Department Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track turnout gear, SCBA cylinders, apparatus, and grant-funded equipment across every station with inspection-ready records built for the fire service.',
    eyebrow: 'FOR THE FIRE SERVICE',
    headline: 'Every piece of gear, ready before the tone drops.',
    subhead:
      'Turnout gear, SCBA cylinders, apparatus, and grant-funded equipment tracked across every station, with inspection and cleaning records that hold up when someone asks for them.',
    statusCards: [
      { item: 'Turnout gear — Set 14', status: 'Overdue' },
      { item: 'SCBA cylinder #0231', status: 'Scheduled' },
      { item: 'Engine 3 — Ladder rack', status: 'Active' },
      { item: 'Thermal imaging camera', status: 'In maintenance' },
    ],
    challengeBullets: [
      'PPE inspection records must match.',
      'SCBA cylinder testing is due.',
      'Grant-funded equipment must be locatable for a federal audit.',
      'Cleaning and exposure history must be defensible.',
    ],
    challengeBody:
      'When any one of these comes up mid-shift or ahead of an audit, a paper log or a spreadsheet that lives on one battalion chief\u2019s laptop rarely has the complete answer fast enough. AssetGriffin keeps that record current automatically, so the answer is a lookup instead of a scramble.',
    solutionSections: [
      {
        heading: 'PPE records that survive personnel changes',
        bullets: [
          'Issue, inspection, cleaning, repair, and retirement tracked per garment, not per firefighter',
          'Records stay attached to the gear itself when it\u2019s reassigned to a new member',
          'Cleaning and exposure history logged against the same record used for inspections',
        ],
      },
      {
        heading: 'Equipment ready when the alarm comes in',
        bullets: [
          'Apparatus inventories organized by compartment, so a check-off matches how the rig is actually loaded',
          'Ladders, tools, and AEDs tracked by serial number and current status across every apparatus',
          'Status updates as soon as an item is checked, so the next shift sees an accurate readiness picture',
        ],
      },
      {
        heading: 'Grant equipment that stays audit-defensible',
        bullets: [
          'Tag equipment by grant source and award year at the time it\u2019s added',
          'Produce a one-click export showing exactly which grant paid for which piece of equipment',
          'Location and status stay current, so a federal audit request doesn\u2019t turn into a facility-wide search',
        ],
      },
    ],
    solutionPreviews: [
      { screen: 'inspections', caption: 'Recurring PPE and SCBA inspection checklists, with failures opening a maintenance task automatically.' },
      { screen: 'maintenance', caption: 'Apparatus and equipment maintenance history, organized by station and due date.' },
    ],
    flexiblePreviewScreen: 'assets',
    flexiblePoints: [
      {
        label: 'Naming conventions',
        body: 'Label gear and apparatus the way your department already refers to them — by unit number, rig assignment, or station roster — instead of a fixed naming scheme.',
      },
      {
        label: 'Location structure',
        body: 'Model your locations as stations, apparatus bays, and compartments, matching how equipment actually moves through a shift.',
      },
      {
        label: 'Inspection cycles',
        body: 'Set inspection and testing intervals aligned with the cycles your department already follows, rather than a template built for a different service.',
      },
    ],
    faqs: [
      {
        question: 'Can we track turnout gear by individual garment instead of by firefighter?',
        answer:
          'Yes. Each garment has its own record — issue date, inspections, cleanings, repairs — that stays attached to the gear even when it\u2019s reassigned to a different member.',
      },
      {
        question: 'Does this replace our SCBA flow testing equipment?',
        answer:
          'No. AssetGriffin tracks the schedule, results, and history of SCBA cylinder testing — it doesn\u2019t replace the testing equipment or process itself.',
      },
      {
        question: 'Can we organize apparatus inventory by compartment?',
        answer:
          'Yes. Apparatus can be broken into compartments so a check-off matches the physical layout of the rig, rather than a flat equipment list.',
      },
      {
        question: 'How do we tie equipment to a specific grant for reporting?',
        answer:
          'Tag any asset with its funding source and award year at the time it\u2019s added, then export a report showing exactly which grant paid for which piece of equipment.',
      },
      {
        question: 'Does this work for volunteer departments with part-time coverage?',
        answer:
          'Yes. Checkouts and inspections can be logged by whoever is on shift, and the record stays complete regardless of staffing schedule.',
      },
      {
        question: 'Can we keep the asset tags already on our gear and apparatus?',
        answer:
          'Yes. During import you can map existing tag or serial numbers to each item instead of generating new ones.',
      },
      {
        question: 'Is our equipment and inspection data secure, and who owns it?',
        answer:
          'Your equipment and inspection data belongs to your department. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
    ],
    ctaHeadline: 'Start tracking your department\u2019s gear free',
  },

  // ---------- Police departments (flagship) ----------
  {
    template: 'flagship',
    group: 'public-sector',
    slug: 'police-departments',
    navLabel: 'Police Departments',
    parentLabel: 'Public Sector',
    parentHref: '/industries/government',
    metaTitle: 'Police Department Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track issued equipment, firearms, and vehicles by officer with a chain-of-custody record built for internal audit, records requests, and shift-change accountability.',
    eyebrow: 'FOR LAW ENFORCEMENT',
    headline: 'A chain of custody that holds up when it\u2019s questioned.',
    subhead:
      'Firearms, radios, vehicles, and issued gear tied to the officer who has them, with a permanent record of every checkout and transfer since day one.',
    statusCards: [
      { item: 'Duty firearm — Badge 214', status: 'Active' },
      { item: 'Patrol vehicle #7', status: 'In maintenance' },
      { item: 'Radio — Unit 22', status: 'Active' },
      { item: 'Armory checkout log', status: 'Needs attention' },
    ],
    challengeBullets: [
      'A firearm can\u2019t be located.',
      'Custody chain is questioned.',
      'Evidence room reconciliation doesn\u2019t match records.',
      'An officer\u2019s issued equipment isn\u2019t accounted for at shift change.',
    ],
    challengeBody:
      'Each of these turns into hours of reconstruction work when the only record is a sign-out sheet or someone\u2019s memory of who had what. AssetGriffin keeps a standing, permanent record of every assignment, so answering these questions is a lookup, not an investigation.',
    solutionSections: [
      {
        heading: 'Issued equipment tied to every officer',
        bullets: [
          'Assignment, transfer, and return history tracked per officer, not just per item',
          'See everything a specific officer currently has checked out in one lookup',
          'Reassignments carry the full prior history forward with the equipment',
        ],
      },
      {
        heading: 'Chain of custody that holds up',
        bullets: [
          'Check-out, transfer, and return logged permanently with a timestamp and the officer who performed it',
          'Records cannot be edited or deleted after the fact',
          'Signature or acknowledgment captured at the point of checkout',
        ],
      },
      {
        heading: 'Station and unit-level accountability',
        bullets: [
          'Locker, vehicle, and armory inventories tracked by station and unit',
          'Shift-change reconciliation shows exactly what\u2019s assigned versus what\u2019s in the armory',
          'Role-based access keeps sensitive equipment categories restricted to authorized personnel',
        ],
      },
    ],
    solutionPreviews: [
      { screen: 'people', caption: 'Officer-level view of everything currently assigned, with full assignment history.' },
    ],
    flexiblePreviewScreen: 'assets',
    flexiblePoints: [
      {
        label: 'Naming conventions',
        body: 'Reference equipment by badge number, unit number, or your department\u2019s existing property tag scheme — not a naming format designed for a different agency.',
      },
      {
        label: 'Location structure',
        body: 'Model locations as stations, patrol divisions, armories, and vehicle fleets to match how your department is actually organized.',
      },
      {
        label: 'Inspection cycles',
        body: 'Set equipment inspection and re-issue intervals aligned with your department\u2019s own policy, rather than a fixed schedule.',
      },
    ],
    faqs: [
      {
        question: 'Can the chain-of-custody log be edited after the fact?',
        answer:
          'No. Every checkout and transfer is permanently attributed to the officer who performed it, which is what makes it usable for internal audit and records requests.',
      },
      {
        question: 'Can we see everything a specific officer currently has checked out?',
        answer:
          'Yes. Checkout is tracked per officer, showing current assignments and the full history of past ones in a single lookup.',
      },
      {
        question: 'Can we restrict access to sensitive equipment like firearms?',
        answer:
          'Yes. Role-based access lets you control which units or ranks can view or check out specific equipment categories.',
      },
      {
        question: 'Does this integrate with our evidence management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the evidence and records management systems your department already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Can we reconcile armory inventory against what\u2019s currently assigned?',
        answer:
          'Yes. A shift-change or periodic reconciliation view shows what\u2019s assigned to officers versus what\u2019s currently in the armory.',
      },
      {
        question: 'Is our issued equipment data secure, and who owns it?',
        answer:
          'Your equipment and custody data belongs to your department. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'How do we import our existing equipment and assignment records?',
        answer:
          'Bulk import brings your current spreadsheet of radios, vehicles, firearms, and gear in as a single pass, mapping to existing tag numbers where they exist.',
      },
    ],
    ctaHeadline: 'Start tracking issued equipment free',
  },

  // ---------- Biomedical (flagship) ----------
  {
    template: 'flagship',
    group: 'healthcare',
    slug: 'biomedical',
    navLabel: 'Biomedical Equipment',
    parentLabel: 'Healthcare',
    parentHref: '/industries/healthcare',
    metaTitle: 'Biomedical Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track medical devices with calibration history, preventive maintenance scheduling, and service records built to survive a biomedical equipment audit.',
    eyebrow: 'FOR BIOMEDICAL ENGINEERING',
    headline: 'Calibration history your next audit won\u2019t have to chase.',
    subhead:
      'Infusion pumps, monitors, and mobile devices tracked with a permanent calibration and preventive maintenance record, so an audit is an export instead of a reconstruction.',
    statusCards: [
      { item: 'Infusion pump — 3W-114', status: 'Overdue' },
      { item: 'Patient monitor — ICU 4', status: 'Active' },
      { item: 'Defibrillator — ED bay 2', status: 'Scheduled' },
      { item: 'Ventilator — 2E-208', status: 'In maintenance' },
    ],
    challengeBullets: [
      'A device can\u2019t be located.',
      'Preventive maintenance is overdue.',
      'An auditor asks for service history.',
      'Calibration documentation is missing.',
    ],
    challengeBody:
      'Any one of these turning up during rounds or a compliance review usually means paging through paper logs across departments to reconstruct what happened and when. AssetGriffin keeps that history current on every device automatically, so the record is already there when it\u2019s asked for.',
    solutionSections: [
      {
        heading: 'Calibration history that survives an audit',
        bullets: [
          'Every calibration event logged permanently against the device record, not a separate spreadsheet',
          'Full history exportable in one pass ahead of a compliance review',
          'Records stay attached to the device through transfers between departments',
        ],
      },
      {
        heading: 'Every device located, every time',
        bullets: [
          'Current department and custodian visible for every piece of mobile equipment',
          'Transfer history shows exactly where a device has been and when it moved',
          'Scan any device from a phone camera to update its location on the spot',
        ],
      },
      {
        heading: 'Preventive maintenance that doesn\u2019t get missed',
        bullets: [
          'Recurring PM schedules configured per device or device category',
          'Automatic reminders before service is due, not after it\u2019s overdue',
          'Overdue devices surfaced in one view instead of buried in a spreadsheet',
        ],
      },
      {
        heading: 'Service records aligned to your own requirements',
        bullets: [
          'Maintenance intervals configurable to match the cycles your biomedical team already follows',
          'Service notes and technician attribution kept with each work order',
          'Full service history exportable for internal or external review',
        ],
      },
    ],
    solutionPreviews: [
      { screen: 'maintenance', caption: 'Preventive maintenance schedule and service history by device.' },
      { screen: 'inspections', caption: 'Recurring calibration checks, with failures automatically opening a maintenance task.' },
    ],
    flexiblePreviewScreen: 'assets',
    flexiblePoints: [
      {
        label: 'Naming conventions',
        body: 'Reference devices by biomedical asset tag, room number, or department code — whatever your team already uses on the equipment itself.',
      },
      {
        label: 'Location structure',
        body: 'Model locations as departments, floors, and rooms to match how equipment actually moves through the facility.',
      },
      {
        label: 'Inspection cycles',
        body: 'Set calibration and PM intervals aligned with the cycles your biomedical engineering team already follows, not a fixed template.',
      },
    ],
    faqs: [
      {
        question: 'Is AssetGriffin a substitute for a validated quality management system?',
        answer:
          'No. AssetGriffin tracks location, custody, and maintenance history for equipment asset management. Confirm it fits your specific regulatory requirements before relying on it for compliance-critical workflows.',
      },
      {
        question: 'Can we set calibration schedules that match our own PM program?',
        answer:
          'Yes. Calibration and maintenance schedules can be configured per device or device category, with automatic reminders before service is due.',
      },
      {
        question: 'Can the calibration history be edited after the fact?',
        answer:
          'No. Every calibration and maintenance event is permanently logged with a timestamp and the technician who performed it.',
      },
      {
        question: 'Does this integrate with our EHR or biomedical equipment management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the EHR and biomedical systems your facility already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Can we track devices across multiple departments and buildings?',
        answer:
          'Yes. Device location and transfer history are tracked across departments and buildings, with the current custodian always visible.',
      },
      {
        question: 'Is our equipment and service data secure, and who owns it?',
        answer:
          'Your equipment and service data belongs to your facility. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'How do we import our existing device inventory?',
        answer:
          'Bulk import brings your current spreadsheet of mobile and fixed equipment in as a single pass, mapping to existing asset tags where they exist.',
      },
    ],
    ctaHeadline: 'Start tracking biomedical equipment free',
  },

  // ---------- Pharmaceutical & laboratory (flagship) ----------
  {
    template: 'flagship',
    group: 'healthcare',
    slug: 'pharmaceutical-laboratory',
    navLabel: 'Pharmaceutical & Laboratory',
    parentLabel: 'Healthcare',
    parentHref: '/industries/healthcare',
    metaTitle: 'Laboratory Equipment & Custody Tracking Software | AssetGriffin',
    metaDescription:
      'Track lab equipment calibration, controlled material custody, and traceability across facilities with a permanent, exportable record.',
    eyebrow: 'FOR PHARMA & LAB OPERATIONS',
    headline: 'Custody and calibration records that match your physical inventory.',
    subhead:
      'Controlled materials, lab instruments, and equipment tracked with a permanent custody and calibration record across every lab and facility.',
    statusCards: [
      { item: 'Centrifuge — Lab 3B', status: 'Scheduled' },
      { item: 'Controlled substance log', status: 'Needs attention' },
      { item: 'Autoclave — Lab 1', status: 'Active' },
      { item: '-80\u00b0C freezer unit', status: 'In maintenance' },
    ],
    challengeBullets: [
      'Controlled material custody is questioned.',
      'Lab equipment calibration lapses go unnoticed.',
      'Traceability records don\u2019t match physical inventory.',
    ],
    challengeBody:
      'When custody or calibration records fall behind what\u2019s actually in the lab, reconciling the two after the fact is slow and puts every downstream record in question. AssetGriffin keeps custody and calibration current as equipment and materials move, so the record and the physical inventory stay in sync.',
    solutionSections: [
      {
        heading: 'Chain of custody for controlled materials',
        bullets: [
          'Every checkout, transfer, and return logged permanently with the person responsible',
          'Custody records cannot be edited or deleted after the fact',
          'Full custody history exportable for internal or regulatory review',
        ],
      },
      {
        heading: 'Calibration and inspection tracking',
        bullets: [
          'Recurring calibration schedules configured per instrument or instrument category',
          'Automatic reminders before calibration is due, not after it lapses',
          'Failed checks automatically open a maintenance task instead of getting noted on paper',
        ],
      },
      {
        heading: 'Traceability across labs and facilities',
        bullets: [
          'Current location and custodian visible for every tracked item across every lab',
          'Transfer history between facilities kept as a single continuous record',
          'Physical inventory and system record stay aligned as items move',
        ],
      },
    ],
    solutionPreviews: [
      { screen: 'audit-log', caption: 'Permanent activity timeline for every custody transfer and status change.' },
      { screen: 'inspections', caption: 'Recurring calibration checks by instrument, with automatic maintenance escalation.' },
    ],
    flexiblePreviewScreen: 'assets',
    flexiblePoints: [
      {
        label: 'Naming conventions',
        body: 'Reference equipment and materials by lab code, batch reference, or internal asset tag — matching your existing lab notation.',
      },
      {
        label: 'Location structure',
        body: 'Model locations as facilities, labs, and storage units to reflect exactly where materials and equipment are held.',
      },
      {
        label: 'Inspection cycles',
        body: 'Set calibration intervals aligned with the cycles your lab already follows for each instrument type.',
      },
    ],
    faqs: [
      {
        question: 'Can the custody log be edited or deleted after the fact?',
        answer:
          'No. Every checkout, transfer, and return is permanently logged with a timestamp and the person who performed it.',
      },
      {
        question: 'Can we set calibration schedules per instrument type?',
        answer:
          'Yes. Calibration intervals are configurable per instrument or category, with automatic reminders before service is due.',
      },
      {
        question: 'Is AssetGriffin a substitute for a validated quality management system?',
        answer:
          'No. AssetGriffin tracks custody, location, and maintenance history for equipment and materials. Confirm it fits your specific regulatory requirements before relying on it for compliance-critical workflows.',
      },
      {
        question: 'Can we track items across multiple labs and facilities?',
        answer:
          'Yes. Location and transfer history are tracked across labs and facilities, with the current custodian always visible.',
      },
      {
        question: 'Does this integrate with our laboratory information management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the LIMS and inventory systems your organization already runs — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our custody and inventory data secure, and who owns it?',
        answer:
          'Your custody and inventory data belongs to your organization. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'How do we import our existing equipment and material inventory?',
        answer:
          'Bulk import brings your current spreadsheet in as a single pass, mapping to existing lab codes or asset tags where they exist.',
      },
    ],
    ctaHeadline: 'Start tracking lab equipment and custody free',
  },

  // ---------- Hospital facilities (functional) ----------
  {
    template: 'functional',
    group: 'healthcare',
    slug: 'hospital-facilities',
    navLabel: 'Hospital Facilities',
    parentLabel: 'Healthcare',
    parentHref: '/industries/healthcare',
    metaTitle: 'Hospital Facilities Equipment Tracking Software | AssetGriffin',
    metaDescription:
      'Track HVAC, generators, elevators, and fire systems across every building with maintenance schedules, location tracking, and inspection checklists.',
    eyebrow: 'By industry · Hospital Facilities',
    title: 'Asset tracking software for hospital facilities teams',
    subtitle:
      'HVAC units, backup generators, elevators, and fire suppression systems tracked across every building, with maintenance and inspection records that hold up under review.',
    hookParagraphs: [
      'A hospital campus runs on facilities equipment that patients never see but can\u2019t function without — air handlers, backup generators, elevators, fire suppression systems — spread across multiple buildings, each with its own maintenance schedule and inspection requirements.',
      'When that equipment is tracked in separate binders per building or a spreadsheet that only one facilities manager updates, finding a single generator\u2019s last service date can take longer than the fix itself. AssetGriffin gives facilities teams one directory for every building, with maintenance history and location tracking that stays current as equipment is serviced.',
    ],
    heroPreviewScreen: 'locations',
    heroPreviewCaption: 'Every building and floor in one location hierarchy, with equipment tracked against each.',
    capabilitySections: [
      {
        heading: 'One directory across every building',
        body: 'HVAC units, generators, elevators, and fire systems tracked in a single directory organized by building and floor, instead of separate records per facility.',
        previewScreen: 'locations',
      },
      {
        heading: 'Maintenance history that doesn\u2019t live in a binder',
        body: 'Preventive maintenance schedules and service history kept against each piece of equipment, with reminders before service is due instead of after a breakdown.',
        previewScreen: 'maintenance',
      },
      {
        heading: 'Inspection checklists for life-safety systems',
        body: 'Recurring inspection checklists for fire suppression, generators, and elevators, with failures automatically opening a maintenance task for the facilities team.',
        previewScreen: 'inspections',
      },
    ],
    faqs: [
      {
        question: 'Can we track equipment across multiple buildings in one place?',
        answer:
          'Yes. Locations can be modeled as buildings and floors, with equipment tracked against the specific building it serves.',
      },
      {
        question: 'Can we schedule maintenance for generators and HVAC separately from IT equipment?',
        answer:
          'Yes. Maintenance schedules are configured per asset or category, so facilities equipment and IT assets can run on entirely separate service intervals.',
      },
      {
        question: 'Can we run recurring inspections on fire suppression systems and elevators?',
        answer:
          'Yes. Recurring inspection checklists can be configured per equipment type, with a failed item automatically opening a maintenance task.',
      },
      {
        question: 'Does AssetGriffin work with our building management system?',
        answer:
          'AssetGriffin is designed to be integration-ready alongside the building management and CMMS tools facilities teams already run — reach out to discuss connecting your specific stack.',
      },
      {
        question: 'Is our facilities equipment data secure, and who owns it?',
        answer:
          'Your equipment and maintenance data belongs to your facility. You can export the full record at any time, and it is never sold or shared with third parties.',
      },
      {
        question: 'How do we import our existing facilities equipment inventory?',
        answer:
          'Bulk import brings each building\u2019s equipment spreadsheet in as a single pass, and facilities teams can start logging maintenance within a day.',
      },
    ],
    ctaHeadline: 'Start tracking facilities equipment free',
  },
]

export function getSubVertical(group: string, slug: string): SubVertical | undefined {
  return subVerticals.find((entry) => entry.group === group && entry.slug === slug)
}
