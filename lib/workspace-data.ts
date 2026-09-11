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

export const assets: AssetRecord[] = [
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

export type OnboardingTemplateId =
  | 'fire-department'
  | 'k12-devices'
  | 'biomedical'
  | 'construction'
  | 'general-assets'
  | 'it-inventory'

export const templateAssetSeeds: Record<OnboardingTemplateId, AssetRecord[]> = {
  'fire-department': [
    { id: 'FD-0001', name: 'Pierce Enforcer Engine 12', category: 'Apparatus', assignedTo: 'Station 4 crew', location: 'Site 04', status: 'In use', purchaseDate: 'Jan 10, 2022', serial: 'PE-ENF-4471', warrantyExpiration: 'Jan 10, 2032', depreciationValue: '$612,000', notes: 'Primary response engine for Station 4.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Nov 2, 2021', Deployed: 'Jan 10, 2022' } },
    { id: 'FD-0002', name: 'Scott Air-Pak SCBA #18', category: 'PPE', assignedTo: 'Marcus Lee', location: 'Site 04', status: 'In use', purchaseDate: 'Mar 4, 2023', serial: 'SCB-0018', warrantyExpiration: 'Mar 4, 2028', depreciationValue: '$4,200', notes: 'Due for annual flow test in October.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Feb 20, 2023', Deployed: 'Mar 4, 2023' } },
    { id: 'FD-0003', name: 'Turnout Gear Set #204', category: 'PPE', assignedTo: 'Unassigned', location: 'Warehouse A', status: 'Available', purchaseDate: 'Jun 18, 2024', serial: 'TG-204', warrantyExpiration: 'Jun 18, 2029', depreciationValue: '$2,850', notes: 'Grant-funded, size Large.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Jun 18, 2024' } },
    { id: 'FD-0004', name: 'Stryker Power-PRO Stretcher', category: 'Medical', assignedTo: 'Station 4 crew', location: 'Site 04', status: 'In maintenance', purchaseDate: 'Sep 2, 2021', serial: 'STK-PP-902', warrantyExpiration: 'Sep 2, 2026', depreciationValue: '$18,400', notes: 'Hydraulic lift service in progress.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Aug 1, 2021', Deployed: 'Sep 2, 2021', 'In Maintenance': 'Sep 3, 2026' } },
    { id: 'FD-0005', name: 'Thermal Imaging Camera TIC-7', category: 'Equipment', assignedTo: 'Unassigned', location: 'Warehouse A', status: 'Available', purchaseDate: 'Apr 14, 2023', serial: 'TIC-0007', warrantyExpiration: 'Apr 14, 2026', depreciationValue: '$9,600', notes: 'Grant-funded FLIR unit.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Apr 14, 2023' } },
  ],
  'k12-devices': [
    { id: 'K12-0001', name: 'Lenovo Chromebook 100e', category: 'Tablets', assignedTo: 'Unassigned', location: 'Austin Depot', status: 'Available', purchaseDate: 'Aug 1, 2024', serial: 'LNV-100E-0451', warrantyExpiration: 'Aug 1, 2027', depreciationValue: '$210', notes: 'Ready for student check-out.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Aug 1, 2024' }, itDetails: { os: 'ChromeOS 126', licenses: ['Google Workspace for Education'], mdmStatus: 'Enrolled', warrantyPlan: 'Lenovo 3yr Depot', warrantyPlanExpiration: 'Aug 1, 2027' } },
    { id: 'K12-0002', name: 'iPad 9th Gen', category: 'Tablets', assignedTo: 'Nora Patel', location: 'New York HQ', status: 'In use', purchaseDate: 'Sep 5, 2023', serial: 'IPD9-2201', warrantyExpiration: 'Sep 5, 2025', depreciationValue: '$260', notes: 'Assigned for 1:1 program, Grade 4.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Aug 20, 2023', Deployed: 'Sep 5, 2023' }, itDetails: { os: 'iPadOS 17.5', licenses: ['Apple School Manager'], mdmStatus: 'Enrolled', warrantyPlan: 'AppleCare+ for Education', warrantyPlanExpiration: 'Sep 5, 2025' } },
    { id: 'K12-0003', name: 'HP ProBook 445 Cart Unit 12', category: 'Computers', assignedTo: 'Unassigned', location: 'Warehouse A', status: 'In maintenance', purchaseDate: 'Jan 15, 2022', serial: 'HP-445-0012', warrantyExpiration: 'Jan 15, 2025', depreciationValue: '$140', notes: 'Cracked screen, awaiting repair part.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Dec 1, 2021', Deployed: 'Jan 15, 2022', 'In Maintenance': 'Sep 2, 2026' } },
    { id: 'K12-0004', name: 'Classroom Projector Epson 2250U', category: 'Displays', assignedTo: 'Theo Grant', location: 'New York HQ', status: 'In use', purchaseDate: 'Feb 8, 2023', serial: 'EPS-2250U-88', warrantyExpiration: 'Feb 8, 2026', depreciationValue: '$780', notes: 'Room 214.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Jan 20, 2023', Deployed: 'Feb 8, 2023' } },
    { id: 'K12-0005', name: 'Chromebook Charging Cart C', category: 'Equipment', assignedTo: 'Unassigned', location: 'Austin Depot', status: 'Available', purchaseDate: 'Jul 10, 2024', serial: 'CART-C-03', warrantyExpiration: 'Jul 10, 2029', depreciationValue: '$920', notes: 'Holds 32 devices, end-of-year return station.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Jul 10, 2024' } },
  ],
  biomedical: [
    { id: 'BIO-0001', name: 'Philips IntelliVue MX450 Monitor', category: 'Equipment', assignedTo: 'Nora Patel', location: 'New York HQ', status: 'In use', purchaseDate: 'May 3, 2022', serial: 'PHL-MX450-771', warrantyExpiration: 'May 3, 2027', depreciationValue: '$14,200', notes: 'ICU bay 3.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Apr 10, 2022', Deployed: 'May 3, 2022' } },
    { id: 'BIO-0002', name: 'Baxter Sigma Spectrum Infusion Pump', category: 'Equipment', assignedTo: 'Unassigned', location: 'Warehouse A', status: 'Available', purchaseDate: 'Oct 12, 2023', serial: 'BAX-SIG-0221', warrantyExpiration: 'Oct 12, 2026', depreciationValue: '$3,100', notes: 'Passed most recent calibration check.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Oct 12, 2023' } },
    { id: 'BIO-0003', name: 'Welch Allyn Vital Signs Monitor', category: 'Equipment', assignedTo: 'Ava Rodriguez', location: 'London Office', status: 'In maintenance', purchaseDate: 'Feb 20, 2021', serial: 'WA-VSM-4102', warrantyExpiration: 'Feb 20, 2025', depreciationValue: '$1,850', notes: 'Preventive maintenance service in progress.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Jan 15, 2021', Deployed: 'Feb 20, 2021', 'In Maintenance': 'Sep 4, 2026' } },
    { id: 'BIO-0004', name: 'Fluke Biomedical ESA620 Analyzer', category: 'Tools', assignedTo: 'Field ops', location: 'Warehouse A', status: 'In use', purchaseDate: 'Jun 9, 2022', serial: 'FLK-ESA620-19', warrantyExpiration: 'Jun 9, 2027', depreciationValue: '$6,400', notes: 'Used for electrical safety testing.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'May 22, 2022', Deployed: 'Jun 9, 2022' } },
    { id: 'BIO-0005', name: 'Drager Fabius Anesthesia Machine', category: 'Equipment', assignedTo: 'Unassigned', location: 'New York HQ', status: 'Available', purchaseDate: 'Aug 30, 2023', serial: 'DRG-FAB-330', warrantyExpiration: 'Aug 30, 2028', depreciationValue: '$41,000', notes: 'Calibration record on file.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Aug 30, 2023' } },
  ],
  construction: [
    { id: 'CON-0001', name: 'CAT 320 Excavator', category: 'Equipment', assignedTo: 'Marcus Lee', location: 'Site 04', status: 'In use', purchaseDate: 'Mar 12, 2021', serial: 'CAT-320-5581', warrantyExpiration: 'Mar 12, 2026', depreciationValue: '$142,000', notes: 'Assigned to Site 04 foundation phase.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Feb 1, 2021', Deployed: 'Mar 12, 2021' } },
    { id: 'CON-0002', name: 'DeWalt Cordless Combo Kit', category: 'Tools', assignedTo: 'Field ops', location: 'Warehouse A', status: 'Available', purchaseDate: 'Jul 22, 2024', serial: 'DWK-COMBO-441', warrantyExpiration: 'Jul 22, 2027', depreciationValue: '$620', notes: 'Includes drill, impact driver, and reciprocating saw.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Jul 22, 2024' } },
    { id: 'CON-0003', name: 'Genie GS-1930 Scissor Lift', category: 'Equipment', assignedTo: 'Unassigned', location: 'Warehouse A', status: 'In maintenance', purchaseDate: 'Nov 4, 2020', serial: 'GEN-GS1930-88', warrantyExpiration: 'Nov 4, 2024', depreciationValue: '$8,900', notes: 'Hydraulic hose replacement in progress.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Oct 1, 2020', Deployed: 'Nov 4, 2020', 'In Maintenance': 'Sep 6, 2026' } },
    { id: 'CON-0004', name: 'Hilti TE 3000-AVR Breaker', category: 'Tools', assignedTo: 'Marcus Lee', location: 'Site 04', status: 'In use', purchaseDate: 'May 8, 2023', serial: 'HLT-TE3000-77', warrantyExpiration: 'May 8, 2026', depreciationValue: '$2,400', notes: 'Assigned for demolition phase.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Apr 20, 2023', Deployed: 'May 8, 2023' } },
    { id: 'CON-0005', name: 'Ford F-350 Flatbed', category: 'Vehicles', assignedTo: 'Field ops', location: 'Site 04', status: 'In use', purchaseDate: 'Jan 30, 2022', serial: 'FD-F350-2201', warrantyExpiration: 'Jan 30, 2025', depreciationValue: '$38,500', notes: 'Fleet vehicle for material transport.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Jan 5, 2022', Deployed: 'Jan 30, 2022' } },
  ],
  'general-assets': [
    { id: 'GEN-0001', name: 'MacBook Air 13”', category: 'Computers', assignedTo: 'Maya Patel', location: 'New York HQ', status: 'In use', purchaseDate: 'Feb 4, 2024', serial: 'MBA13-0091', warrantyExpiration: 'Feb 4, 2027', depreciationValue: '$980', notes: 'Standard onboarding laptop.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Jan 20, 2024', Deployed: 'Feb 4, 2024' } },
    { id: 'GEN-0002', name: 'Office Desk 60”', category: 'Furniture', assignedTo: 'Unassigned', location: 'New York HQ', status: 'Available', purchaseDate: 'Mar 1, 2023', serial: 'DSK-60-114', warrantyExpiration: 'Mar 1, 2033', depreciationValue: '$310', notes: '', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Mar 1, 2023' } },
    { id: 'GEN-0003', name: 'Epson Workforce Printer', category: 'Equipment', assignedTo: 'Jordan Lee', location: 'London Office', status: 'In maintenance', purchaseDate: 'Jun 15, 2022', serial: 'EPS-WF-552', warrantyExpiration: 'Jun 15, 2025', depreciationValue: '$140', notes: 'Paper feed jam reported.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'May 30, 2022', Deployed: 'Jun 15, 2022', 'In Maintenance': 'Sep 5, 2026' } },
    { id: 'GEN-0004', name: 'iPhone 14', category: 'Mobile', assignedTo: 'Theo Grant', location: 'New York HQ', status: 'In use', purchaseDate: 'Oct 9, 2023', serial: 'IP14-2287', warrantyExpiration: 'Oct 9, 2025', depreciationValue: '$620', notes: '', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Sep 25, 2023', Deployed: 'Oct 9, 2023' } },
    { id: 'GEN-0005', name: 'Conference Room Display 65”', category: 'Displays', assignedTo: 'Unassigned', location: 'Austin Depot', status: 'Available', purchaseDate: 'Aug 4, 2024', serial: 'CRD-65-009', warrantyExpiration: 'Aug 4, 2027', depreciationValue: '$1,120', notes: '', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Aug 4, 2024' } },
  ],
  'it-inventory': [
    { id: 'IT-0001', name: 'Dell OptiPlex 7020 Desktop', category: 'Computers', assignedTo: 'Ava Rodriguez', location: 'London Office', status: 'In use', purchaseDate: 'Jan 18, 2023', serial: 'DL-OP7020-341', warrantyExpiration: 'Jan 18, 2026', depreciationValue: '$540', notes: 'Standard issue desktop.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Jan 4, 2023', Deployed: 'Jan 18, 2023' }, itDetails: { os: 'Windows 11 Pro 23H2', licenses: ['Microsoft 365 E3'], mdmStatus: 'Enrolled', warrantyPlan: 'Dell ProSupport', warrantyPlanExpiration: 'Jan 18, 2026' } },
    { id: 'IT-0002', name: 'Lenovo ThinkCentre Server Node 2', category: 'Computers', assignedTo: 'Unassigned', location: 'Austin Depot', status: 'Available', purchaseDate: 'Sep 2, 2022', serial: 'LNV-TC-SRV2', warrantyExpiration: 'Sep 2, 2027', depreciationValue: '$1,940', notes: 'Rack unit 4, spare capacity.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Sep 2, 2022' }, itDetails: { os: 'Windows Server 2022', licenses: ['Windows Server CAL'], mdmStatus: 'Enrolled', warrantyPlan: 'Lenovo Premier Support', warrantyPlanExpiration: 'Sep 2, 2027' } },
    { id: 'IT-0003', name: 'Cisco Catalyst 9200 Switch', category: 'Equipment', assignedTo: 'Field ops', location: 'Warehouse A', status: 'In use', purchaseDate: 'Apr 11, 2021', serial: 'CSC-9200-118', warrantyExpiration: 'Apr 11, 2024', depreciationValue: '$2,280', notes: 'Core switch, Warehouse A.', lifecycleStage: 'Deployed', lifecycleDates: { Procurement: 'Mar 30, 2021', Deployed: 'Apr 11, 2021' } },
    { id: 'IT-0004', name: 'Dell U2419H Monitor', category: 'Displays', assignedTo: 'Maya Patel', location: 'New York HQ', status: 'In maintenance', purchaseDate: 'Dec 5, 2022', serial: 'DL-U2419H-902', warrantyExpiration: 'Dec 5, 2025', depreciationValue: '$130', notes: 'Flickering panel reported.', lifecycleStage: 'In Maintenance', lifecycleDates: { Procurement: 'Nov 18, 2022', Deployed: 'Dec 5, 2022', 'In Maintenance': 'Sep 7, 2026' } },
    { id: 'IT-0005', name: 'iPhone 13 (IT loaner pool)', category: 'Mobile', assignedTo: 'Unassigned', location: 'New York HQ', status: 'Available', purchaseDate: 'Feb 27, 2023', serial: 'IP13-LOAN-06', warrantyExpiration: 'Feb 27, 2025', depreciationValue: '$390', notes: 'Loaner pool device for travel.', lifecycleStage: 'Procurement', lifecycleDates: { Procurement: 'Feb 27, 2023' }, itDetails: { os: 'iOS 17.4', licenses: [], mdmStatus: 'Enrolled', warrantyPlan: 'AppleCare+', warrantyPlanExpiration: 'Feb 27, 2025' } },
  ],
}

export function applyTemplateSeed(templateId: OnboardingTemplateId) {
  const seed = templateAssetSeeds[templateId]
  if (!seed) return
  assets.splice(0, assets.length, ...seed.map((asset) => ({ ...asset })))
}

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
