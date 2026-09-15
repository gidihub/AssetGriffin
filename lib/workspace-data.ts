/** Marketing preview fixtures and shared workspace record types. Live data comes from Supabase. */

export type AssetStatus = 'In use' | 'In maintenance' | 'Retired' | 'Available'

export type LifecycleStage = 'Procurement' | 'Deployed' | 'In Maintenance' | 'Retired/Disposed'

export const lifecycleStageOrder: LifecycleStage[] = ['Procurement', 'Deployed', 'In Maintenance', 'Retired/Disposed']

export interface ITDetails {
  os: string
  licenses: string[]
  mdmStatus: 'Enrolled' | 'Not enrolled'
  warrantyPlan: string
  warrantyPlanExpiration: string
}

export interface AssetRecord {
  id: string
  name: string
  category: string
  assignedTo: string
  location: string
  status: AssetStatus
  purchaseDate: string
  serial: string
  warrantyExpiration: string
  depreciationValue: string
  notes: string
  lifecycleStage: LifecycleStage
  lifecycleDates: Partial<Record<LifecycleStage, string>>
  itDetails?: ITDetails
}

export const itCategories = ['Computers', 'Tablets', 'Mobile', 'Displays']

export function getLifecycleHistory(asset: AssetRecord) {
  return lifecycleStageOrder
    .slice(0, lifecycleStageOrder.indexOf(asset.lifecycleStage) + 1)
    .map((stage) => ({ stage, date: asset.lifecycleDates[stage] ?? '—' }))
}

export interface PersonRecord {
  id: string
  name: string
  team: string
  role: string
  department: string
  email: string
  phone: string
  assetsAssigned: string[]
  lastCheckOut: string
  status: 'Active' | 'Invited' | 'Overdue'
}

export interface LocationRecord {
  id: string
  name: string
  type: 'Office' | 'Warehouse' | 'Job site'
  manager: string
  lastAudit: string
  address: string
}

export interface MaintenanceRecord {
  id: string
  asset: string
  issueType: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  technician: string
  dueDate: string
  status: 'Open' | 'Scheduled' | 'Overdue' | 'Resolved'
  description: string
  partsUsed: string
  cost: string
  resolutionNotes: string
}

export interface AuditRecord {
  id: string
  name: string
  scope: string
  auditor: string
  startDate: string
  status: 'In progress' | 'Complete' | 'Needs attention' | 'Planned'
  scanned: number
  expected: number
  discrepancies: { asset: string; issue: string }[]
  notes: string
}

export interface ReportRecord {
  id: string
  name: string
  type: string
  lastRun: string
  frequency: string
  owner: string
  summary: string
}

/** Static rows for marketing product previews only — not used by the authenticated workspace. */
export const previewAssets: AssetRecord[] = [
  { id: 'NST-1048', name: 'MacBook Pro 14”', category: 'Computers', assignedTo: 'Maya Patel', location: 'New York HQ', status: 'In use', purchaseDate: 'Feb 12, 2024', serial: 'C02ZK1A4MD6M', warrantyExpiration: 'Feb 12, 2027', depreciationValue: '$1,840', notes: 'Assigned during onboarding.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Feb 12, 2024', Deployed: 'Feb 20, 2024' }, itDetails: { os: 'macOS Sonoma 14.4', licenses: ['Microsoft 365 E3', 'Figma Professional'], mdmStatus: 'Enrolled', warrantyPlan: 'AppleCare+', warrantyPlanExpiration: 'Feb 12, 2027' } },
  { id: 'NST-1047', name: 'Dell Latitude 5440', category: 'Computers', assignedTo: 'Unassigned', location: 'Austin Depot', status: 'Available', purchaseDate: 'Nov 3, 2023', serial: '7XK91P2', warrantyExpiration: 'Nov 3, 2026', depreciationValue: '$620', notes: 'Returned from Jordan Lee, awaiting reissue.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Nov 3, 2023' }, itDetails: { os: 'Windows 11 Pro 23H2', licenses: ['Microsoft 365 E3'], mdmStatus: 'Enrolled', warrantyPlan: 'Dell ProSupport Plus', warrantyPlanExpiration: 'Nov 3, 2026' } },
  { id: 'NST-1041', name: 'Herman Miller Aeron', category: 'Furniture', assignedTo: 'Jordan Lee', location: 'New York HQ', status: 'In use', purchaseDate: 'May 18, 2022', serial: 'AER-88210', warrantyExpiration: 'May 18, 2032', depreciationValue: '$740', notes: '', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'May 18, 2022', Deployed: 'May 24, 2022' } },
  { id: 'NST-1032', name: 'Sony FX3 Camera', category: 'Equipment', assignedTo: 'Studio team', location: 'Chicago Studio', status: 'In maintenance', purchaseDate: 'Aug 9, 2023', serial: 'SNY-220941', warrantyExpiration: 'Aug 9, 2025', depreciationValue: '$2,980', notes: 'In for sensor calibration.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Aug 9, 2023', Deployed: 'Aug 15, 2023', 'In Maintenance': 'Sep 5, 2026' } },
  { id: 'NST-1029', name: 'iPad Pro 12.9”', category: 'Tablets', assignedTo: 'Unassigned', location: 'New York HQ', status: 'Available', purchaseDate: 'Jan 22, 2024', serial: 'DMQ9P2K3', warrantyExpiration: 'Jan 22, 2026', depreciationValue: '$980', notes: '', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Jan 22, 2024' }, itDetails: { os: 'iPadOS 17.4', licenses: [], mdmStatus: 'Not enrolled', warrantyPlan: 'AppleCare+', warrantyPlanExpiration: 'Jan 22, 2026' } },
  { id: 'NST-1052', name: 'Dell U2723QE', category: 'Displays', assignedTo: 'Unassigned', location: 'New York HQ', status: 'Available', purchaseDate: 'Mar 4, 2024', serial: 'U27-90211', warrantyExpiration: 'Mar 4, 2027', depreciationValue: '$410', notes: '', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Mar 4, 2024' }, itDetails: { os: '—', licenses: [], mdmStatus: 'Not enrolled', warrantyPlan: 'Dell Premium Panel Exchange', warrantyPlanExpiration: 'Mar 4, 2027' } },
  { id: 'NST-1055', name: 'Hilti TE 30-A36', category: 'Tools', assignedTo: 'Marcus Lee', location: 'Site 04', status: 'In maintenance', purchaseDate: 'Jun 14, 2021', serial: 'HLT-30A-6631', warrantyExpiration: 'Jun 14, 2024', depreciationValue: '$210', notes: 'Annual calibration in progress.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Jun 14, 2021', Deployed: 'Jun 20, 2021', 'In Maintenance': 'Sep 1, 2026' } },
  { id: 'NST-1060', name: 'iPhone 15 Pro', category: 'Mobile', assignedTo: 'Nora Patel', location: 'London Office', status: 'In use', purchaseDate: 'Oct 2, 2023', serial: 'IP15-77213', warrantyExpiration: 'Oct 2, 2025', depreciationValue: '$890', notes: '', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Oct 2, 2023', Deployed: 'Oct 6, 2023' }, itDetails: { os: 'iOS 17.5', licenses: [], mdmStatus: 'Enrolled', warrantyPlan: 'AppleCare+', warrantyPlanExpiration: 'Oct 2, 2025' } },
  { id: 'NST-1063', name: 'Ford Transit 08', category: 'Vehicles', assignedTo: 'Marcus Lee', location: 'Site 04', status: 'In use', purchaseDate: 'Jan 9, 2020', serial: 'FT-VIN-4471', warrantyExpiration: 'Jan 9, 2023', depreciationValue: '$8,200', notes: 'Fleet vehicle, oil change due.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Jan 9, 2020', Deployed: 'Jan 15, 2020' } },
  { id: 'NST-1066', name: 'Laser level L-204', category: 'Tools', assignedTo: 'Field ops', location: 'Warehouse A', status: 'In maintenance', purchaseDate: 'Jul 30, 2022', serial: 'L204-8821', warrantyExpiration: 'Jul 30, 2024', depreciationValue: '$95', notes: 'Battery replacement pending.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Jul 30, 2022', Deployed: 'Aug 4, 2022', 'In Maintenance': 'Aug 28, 2026' } },
  { id: 'NST-1071', name: 'Herman Miller Aeron', category: 'Furniture', assignedTo: 'Theo Grant', location: 'New York HQ', status: 'In use', purchaseDate: 'Sep 1, 2022', serial: 'AER-88244', warrantyExpiration: 'Sep 1, 2032', depreciationValue: '$720', notes: '', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Sep 1, 2022', Deployed: 'Sep 6, 2022' } },
  { id: 'NST-1004', name: 'ThinkPad X1 Carbon', category: 'Computers', assignedTo: 'Ava Rodriguez', location: 'London Office', status: 'Retired', purchaseDate: 'Apr 2, 2019', serial: 'TP-X1-40021', warrantyExpiration: 'Apr 2, 2022', depreciationValue: '$0', notes: 'Decommissioned, pending recycling.', lifecycleStage: 'Retired/Disposed', lifecycleDates: { Procurement: 'Apr 2, 2019', Deployed: 'Apr 9, 2019', 'In Maintenance': 'Jun 2, 2025', 'Retired/Disposed': 'Aug 15, 2026' }, itDetails: { os: 'Windows 10 Enterprise', licenses: [], mdmStatus: 'Not enrolled', warrantyPlan: 'Lenovo Premier Support', warrantyPlanExpiration: 'Apr 2, 2022' } },
  { id: 'NST-1075', name: 'Toyota 8FGCU25 Forklift', category: 'Equipment', assignedTo: 'Field ops', location: 'Warehouse A', status: 'In use', purchaseDate: 'Mar 3, 2021', serial: '8FGCU25-4471', warrantyExpiration: 'Mar 3, 2024', depreciationValue: '$4,100', notes: 'Primary forklift for pallet staging.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Mar 3, 2021', Deployed: 'Mar 10, 2021' } },
]

export const people: PersonRecord[] = [
  { id: 'PPL-01', name: 'Maya Patel', team: 'Engineering', role: 'Software Engineer', department: 'Engineering', email: 'maya.patel@summittech.com', phone: '(212) 555-0148', assetsAssigned: ['NST-1048'], lastCheckOut: 'Today, 9:14 AM', status: 'Active' },
  { id: 'PPL-02', name: 'Jordan Lee', team: 'Engineering', role: 'Engineering Manager', department: 'Engineering', email: 'jordan.lee@summittech.com', phone: '(212) 555-0117', assetsAssigned: ['NST-1041'], lastCheckOut: 'Aug 30', status: 'Active' },
  { id: 'PPL-03', name: 'Marcus Lee', team: 'Field Operations', role: 'Site Supervisor', department: 'Operations', email: 'marcus.lee@summittech.com', phone: '(512) 555-0193', assetsAssigned: ['NST-1055', 'NST-1063'], lastCheckOut: 'Yesterday', status: 'Overdue' },
  { id: 'PPL-04', name: 'Nora Patel', team: 'Finance', role: 'Financial Analyst', department: 'Finance', email: 'nora.patel@summittech.com', phone: '(020) 555-0164', assetsAssigned: ['NST-1060'], lastCheckOut: 'Aug 28', status: 'Active' },
  { id: 'PPL-05', name: 'Theo Grant', team: 'Design', role: 'Product Designer', department: 'Design', email: 'theo.grant@summittech.com', phone: '(212) 555-0121', assetsAssigned: ['NST-1071'], lastCheckOut: 'Aug 21', status: 'Invited' },
  { id: 'PPL-06', name: 'Ava Rodriguez', team: 'Engineering', role: 'Senior Engineer', department: 'Engineering', email: 'ava.rodriguez@summittech.com', phone: '(020) 555-0188', assetsAssigned: [], lastCheckOut: 'Jul 2', status: 'Active' },
]

export const locations: LocationRecord[] = [
  { id: 'LOC-01', name: 'New York HQ', type: 'Office', manager: 'Jamie Smith', lastAudit: 'Sep 1, 2026', address: '1 Liberty Plaza, New York, NY' },
  { id: 'LOC-02', name: 'London Office', type: 'Office', manager: 'Priya Shah', lastAudit: 'Aug 12, 2026', address: '20 Fenchurch Street, London' },
  { id: 'LOC-03', name: 'Site 04', type: 'Job site', manager: 'Marcus Lee', lastAudit: 'Jun 3, 2026', address: '4400 Industrial Blvd, Austin, TX' },
  { id: 'LOC-04', name: 'Warehouse A', type: 'Warehouse', manager: 'Priya Nair', lastAudit: 'Jul 22, 2026', address: '880 Dockside Rd, Austin, TX' },
  { id: 'LOC-05', name: 'Chicago Studio', type: 'Office', manager: 'Dana Whitfield', lastAudit: 'May 15, 2026', address: '212 W Randolph St, Chicago, IL' },
  { id: 'LOC-06', name: 'Austin Depot', type: 'Warehouse', manager: 'Priya Nair', lastAudit: 'Apr 30, 2026', address: '1900 Metric Blvd, Austin, TX' },
]

export const maintenance: MaintenanceRecord[] = [
  { id: 'WO-201', asset: 'Hilti TE 30-A36', issueType: 'Calibration', priority: 'High', technician: 'Marcus Lee', dueDate: 'Sep 14, 2026', status: 'Overdue', description: 'Annual torque calibration required by manufacturer.', partsUsed: 'Calibration kit', cost: '$85', resolutionNotes: '' },
  { id: 'WO-202', asset: 'Ford Transit 08', issueType: 'Oil change', priority: 'Medium', technician: 'Fleet team', dueDate: 'Sep 18, 2026', status: 'Scheduled', description: 'Routine 5,000 mile service interval.', partsUsed: 'Oil filter, 5W-30 oil', cost: '$120', resolutionNotes: '' },
  { id: 'WO-203', asset: 'Dell Latitude 5440', issueType: 'Warranty repair', priority: 'Medium', technician: 'IT team', dueDate: 'Sep 22, 2026', status: 'Open', description: 'Keyboard backlight failure reported by prior user.', partsUsed: 'Pending diagnosis', cost: '$0', resolutionNotes: '' },
  { id: 'WO-204', asset: 'Laser level L-204', issueType: 'Battery replacement', priority: 'Low', technician: 'Field ops', dueDate: 'Sep 27, 2026', status: 'Overdue', description: 'Battery no longer holds charge past 20 minutes.', partsUsed: 'Li-ion battery pack', cost: '$45', resolutionNotes: '' },
  { id: 'WO-205', asset: 'Sony FX3 Camera', issueType: 'Lens calibration', priority: 'Critical', technician: 'Studio team', dueDate: 'Sep 9, 2026', status: 'Resolved', description: 'Autofocus drift on telephoto lens mount.', partsUsed: 'Lens calibration service', cost: '$310', resolutionNotes: 'Recalibrated and tested against reference chart. Passed QA.' },
  { id: 'WO-206', asset: 'Herman Miller Aeron', issueType: 'Cylinder replacement', priority: 'Low', technician: 'Facilities', dueDate: 'Oct 2, 2026', status: 'Scheduled', description: 'Pneumatic height cylinder no longer holds position.', partsUsed: 'Pending', cost: '$0', resolutionNotes: '' },
]

export const audits: AuditRecord[] = [
  { id: 'AUD-01', name: 'Q3 physical audit', scope: 'New York HQ', auditor: 'Jamie Smith', startDate: 'Sep 1, 2026', status: 'In progress', scanned: 312, expected: 401, discrepancies: [{ asset: 'NST-1029 · iPad Pro 12.9”', issue: 'Not found at expected desk location' }, { asset: 'NST-1004 · ThinkPad X1 Carbon', issue: 'Marked retired but scanned in storage' }], notes: 'On track for Sep 30 close.' },
  { id: 'AUD-02', name: 'Site 04 handoff', scope: 'Site 04', auditor: 'Marcus Lee', startDate: 'Aug 20, 2026', status: 'Needs attention', scanned: 47, expected: 112, discrepancies: [{ asset: 'NST-1055 · Hilti TE 30-A36', issue: 'Serial number mismatch on record' }, { asset: 'Unlisted power tool', issue: 'Found on-site, not in register' }, { asset: 'NST-1063 · Ford Transit 08', issue: 'Odometer reading not logged' }], notes: 'Falling behind schedule, needs additional staffing.' },
  { id: 'AUD-03', name: 'Warranty review', scope: 'All locations', auditor: 'Nora Patel', startDate: 'Aug 1, 2026', status: 'Complete', scanned: 1284, expected: 1284, discrepancies: [], notes: 'All warranty records reconciled with vendor data.' },
  { id: 'AUD-04', name: 'Unassigned assets sweep', scope: 'Workspace', auditor: 'Jamie Smith', startDate: 'Sep 20, 2026', status: 'Planned', scanned: 0, expected: 96, discrepancies: [], notes: 'Scheduled to start after Q3 audit closes.' },
]

export const reports: ReportRecord[] = [
  { id: 'RPT-01', name: 'Asset register', type: 'Inventory', lastRun: 'Today, 8:02 AM', frequency: 'Daily', owner: 'Jamie Smith', summary: 'Full inventory snapshot of 1,284 assets across 6 locations, grouped by category and status.' },
  { id: 'RPT-02', name: 'Depreciation summary', type: 'Finance', lastRun: 'Yesterday', frequency: 'Monthly', owner: 'Finance team', summary: 'Book value and depreciation schedule for all capitalized assets, exported for the finance close.' },
  { id: 'RPT-03', name: 'Audit reconciliation', type: 'Compliance', lastRun: 'Aug 28, 2026', frequency: 'Quarterly', owner: 'Jamie Smith', summary: 'Compares scanned counts to expected counts across all completed audits, flagging discrepancies.' },
  { id: 'RPT-04', name: 'Maintenance costs', type: 'Operations', lastRun: 'Aug 25, 2026', frequency: 'Monthly', owner: 'Marcus Lee', summary: 'Total service spend by asset category, with technician and downtime breakdown.' },
  { id: 'RPT-05', name: 'Checked-out aging', type: 'Inventory', lastRun: 'Aug 20, 2026', frequency: 'Weekly', owner: 'Jamie Smith', summary: 'Assets checked out longer than 90 days, sorted by assignee and location.' },
]

export interface ChecklistTemplate {
  id: string
  name: string
  items: string[]
}

export interface InspectionResultItem {
  item: string
  pass: boolean
}

export interface InspectionHistoryEntry {
  date: string
  status: 'Passed' | 'Failed'
  notes: string
}

export type InspectionStatus = 'Passed' | 'Failed' | 'Overdue' | 'Scheduled'

export interface InspectionRecord {
  id: string
  assetId: string
  asset: string
  checklistTemplateId: string
  assignedInspector: string
  dueDate: string
  status: InspectionStatus
  lastCompleted: string
  results: InspectionResultItem[]
  inspectorNotes: string
  history: InspectionHistoryEntry[]
}

export const checklistTemplates: ChecklistTemplate[] = [
  { id: 'CHK-01', name: 'Forklift Safety Check', items: ['Brakes', 'Lights', 'Fluid levels', 'Load capacity sticker', 'Horn function', 'Tire condition'] },
  { id: 'CHK-02', name: 'Laptop Return Inspection', items: ['Screen condition', 'Battery health', 'Charger included', 'Data wiped', 'Keyboard function', 'Case / cosmetic condition'] },
  { id: 'CHK-03', name: 'Vehicle Pre-Trip Inspection', items: ['Tire pressure', 'Oil level', 'Lights & signals', 'Mirrors', 'Seatbelts', 'Registration & insurance current'] },
]

export const inspections: InspectionRecord[] = [
  {
    id: 'INS-01',
    assetId: 'NST-1075',
    asset: 'Toyota 8FGCU25 Forklift',
    checklistTemplateId: 'CHK-01',
    assignedInspector: 'Marcus Lee',
    dueDate: 'Sep 12, 2026',
    status: 'Overdue',
    lastCompleted: 'Aug 12, 2026',
    results: [
      { item: 'Brakes', pass: true },
      { item: 'Lights', pass: true },
      { item: 'Fluid levels', pass: true },
      { item: 'Load capacity sticker', pass: false },
      { item: 'Horn function', pass: true },
      { item: 'Tire condition', pass: true },
    ],
    inspectorNotes: 'Load capacity sticker is faded and illegible. Ordered a replacement decal; recheck once installed.',
    history: [
      { date: 'Aug 12, 2026', status: 'Failed', notes: 'Load capacity sticker illegible.' },
      { date: 'Jul 12, 2026', status: 'Passed', notes: 'All checklist items passed.' },
      { date: 'Jun 12, 2026', status: 'Passed', notes: 'All checklist items passed.' },
    ],
  },
  {
    id: 'INS-02',
    assetId: 'NST-1047',
    asset: 'Dell Latitude 5440',
    checklistTemplateId: 'CHK-02',
    assignedInspector: 'IT team',
    dueDate: 'Sep 10, 2026',
    status: 'Failed',
    lastCompleted: 'Sep 9, 2026',
    results: [
      { item: 'Screen condition', pass: true },
      { item: 'Battery health', pass: false },
      { item: 'Charger included', pass: true },
      { item: 'Data wiped', pass: true },
      { item: 'Keyboard function', pass: true },
      { item: 'Case / cosmetic condition', pass: true },
    ],
    inspectorNotes: 'Battery health at 61% with visible swelling near the hinge. Do not reissue until battery is replaced.',
    history: [
      { date: 'Sep 9, 2026', status: 'Failed', notes: 'Battery swelling detected on return.' },
      { date: 'Nov 3, 2023', status: 'Passed', notes: 'Initial deployment check.' },
    ],
  },
  {
    id: 'INS-03',
    assetId: 'NST-1004',
    asset: 'ThinkPad X1 Carbon',
    checklistTemplateId: 'CHK-02',
    assignedInspector: 'IT team',
    dueDate: 'Aug 15, 2026',
    status: 'Passed',
    lastCompleted: 'Aug 15, 2026',
    results: [
      { item: 'Screen condition', pass: true },
      { item: 'Battery health', pass: true },
      { item: 'Charger included', pass: true },
      { item: 'Data wiped', pass: true },
      { item: 'Keyboard function', pass: true },
      { item: 'Case / cosmetic condition', pass: true },
    ],
    inspectorNotes: 'Clean return, cleared for recycling per decommission workflow.',
    history: [{ date: 'Aug 15, 2026', status: 'Passed', notes: 'Cleared for recycling.' }],
  },
  {
    id: 'INS-04',
    assetId: 'NST-1063',
    asset: 'Ford Transit 08',
    checklistTemplateId: 'CHK-03',
    assignedInspector: 'Marcus Lee',
    dueDate: 'Sep 9, 2026',
    status: 'Scheduled',
    lastCompleted: 'Aug 9, 2026',
    results: [
      { item: 'Tire pressure', pass: true },
      { item: 'Oil level', pass: true },
      { item: 'Lights & signals', pass: true },
      { item: 'Mirrors', pass: true },
      { item: 'Seatbelts', pass: true },
      { item: 'Registration & insurance current', pass: true },
    ],
    inspectorNotes: 'Routine monthly pre-trip check, scheduled ahead of the oil change work order.',
    history: [
      { date: 'Aug 9, 2026', status: 'Passed', notes: 'All checklist items passed.' },
      { date: 'Jul 9, 2026', status: 'Passed', notes: 'All checklist items passed.' },
    ],
  },
  {
    id: 'INS-05',
    assetId: 'NST-1048',
    asset: 'MacBook Pro 14”',
    checklistTemplateId: 'CHK-02',
    assignedInspector: 'Ava Rodriguez',
    dueDate: 'Oct 1, 2026',
    status: 'Scheduled',
    lastCompleted: 'Oct 1, 2025',
    results: [
      { item: 'Screen condition', pass: true },
      { item: 'Battery health', pass: true },
      { item: 'Charger included', pass: true },
      { item: 'Data wiped', pass: true },
      { item: 'Keyboard function', pass: true },
      { item: 'Case / cosmetic condition', pass: true },
    ],
    inspectorNotes: 'Annual asset health check for actively deployed hardware.',
    history: [{ date: 'Oct 1, 2025', status: 'Passed', notes: 'All checklist items passed.' }],
  },
  {
    id: 'INS-06',
    assetId: 'NST-1032',
    asset: 'Sony FX3 Camera',
    checklistTemplateId: 'CHK-01',
    assignedInspector: 'Studio team',
    dueDate: 'Sep 20, 2026',
    status: 'Scheduled',
    lastCompleted: 'Mar 20, 2026',
    results: [
      { item: 'Brakes', pass: true },
      { item: 'Lights', pass: true },
      { item: 'Fluid levels', pass: true },
      { item: 'Load capacity sticker', pass: true },
      { item: 'Horn function', pass: true },
      { item: 'Tire condition', pass: true },
    ],
    inspectorNotes: 'Reused general equipment checklist pending a dedicated camera gear template.',
    history: [{ date: 'Mar 20, 2026', status: 'Passed', notes: 'All checklist items passed.' }],
  },
]

export const statusToneMap: Record<string, 'positive' | 'warning' | 'critical' | 'neutral' | 'info'> = {
  'In use': 'info',
  Available: 'positive',
  'In maintenance': 'warning',
  Retired: 'neutral',
  Active: 'positive',
  Invited: 'neutral',
  Overdue: 'critical',
  Open: 'warning',
  Scheduled: 'info',
  Resolved: 'positive',
  'In progress': 'info',
  Complete: 'positive',
  'Needs attention': 'critical',
  Planned: 'neutral',
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Critical: 'critical',
  Passed: 'positive',
  Failed: 'critical',
  Enrolled: 'positive',
  'Not enrolled': 'neutral',
}
