export type OnboardingTemplateId =
  | 'fire-department'
  | 'k12-devices'
  | 'biomedical'
  | 'construction'
  | 'general-assets'
  | 'it-inventory'

export interface OnboardingTemplate {
  id: OnboardingTemplateId
  title: string
  description: string
  tags: string[]
  image: string
  categories: string[]
}

export const onboardingTemplates: OnboardingTemplate[] = [
  {
    id: 'fire-department',
    title: 'Fire Department Readiness',
    description: 'Track apparatus, PPE, SCBA, and grant-funded equipment with built-in inspection schedules and audit-ready reporting.',
    tags: ['Public Safety', 'Compliance', 'Inspections'],
    image: '/images/templates/fire-department.png',
    categories: ['Apparatus', 'PPE', 'Medical', 'Equipment'],
  },
  {
    id: 'k12-devices',
    title: 'K-12 Device Assignment',
    description: 'Manage 1:1 device programs, assign Chromebooks and equipment to students, and streamline end-of-year returns.',
    tags: ['Education', 'IT', 'Check-out'],
    image: '/images/templates/k12-devices.png',
    categories: ['Tablets', 'Computers', 'Displays', 'Equipment'],
  },
  {
    id: 'biomedical',
    title: 'Biomedical Equipment Tracking',
    description: 'Track biomedical equipment with preventive maintenance schedules, calibration records, and compliance-ready audit trails.',
    tags: ['Healthcare', 'Compliance', 'Maintenance'],
    image: '/images/templates/biomedical.png',
    categories: ['Equipment', 'Tools'],
  },
  {
    id: 'construction',
    title: 'Construction Equipment Tracking',
    description: 'Track tools and heavy equipment across job sites with mobile scanning and location tracking.',
    tags: ['Construction', 'Field Operations'],
    image: '/images/templates/construction.png',
    categories: ['Equipment', 'Tools', 'Vehicles'],
  },
  {
    id: 'general-assets',
    title: 'General Asset Management',
    description: "An introductory setup covering asset tracking, assignments, locations, and status monitoring — a good starting point if you're not sure which template fits.",
    tags: ['General', 'Operations'],
    image: '/images/templates/general-assets.png',
    categories: ['Computers', 'Furniture', 'Equipment', 'Mobile', 'Displays'],
  },
  {
    id: 'it-inventory',
    title: 'IT Device Inventory',
    description: 'Manage IT hardware lifecycle including check-in/check-out, warranty tracking, and depreciation.',
    tags: ['Technology', 'IT'],
    image: '/images/templates/it-inventory.png',
    categories: ['Computers', 'Equipment', 'Displays', 'Mobile'],
  },
]

export function matchTemplateFromPrompt(prompt: string): OnboardingTemplate {
  const normalized = prompt.toLowerCase()
  const keywordMap: Record<OnboardingTemplateId, string[]> = {
    'fire-department': ['fire', 'apparatus', 'scba', 'ppe', 'engine', 'station', 'firefighter'],
    'k12-devices': ['school', 'student', 'classroom', 'chromebook', 'k-12', 'k12', 'teacher', 'district'],
    biomedical: ['hospital', 'medical', 'biomedical', 'clinical', 'patient', 'calibration', 'health'],
    construction: ['construction', 'job site', 'jobsite', 'contractor', 'excavator', 'crew', 'site'],
    'it-inventory': ['it ', 'laptop', 'desktop', 'helpdesk', 'warranty', 'software', 'server'],
    'general-assets': [],
  }
  let bestMatch: OnboardingTemplateId = 'general-assets'
  let bestScore = 0
  for (const template of onboardingTemplates) {
    const keywords = keywordMap[template.id]
    const score = keywords.filter((keyword) => normalized.includes(keyword)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = template.id
    }
  }
  return onboardingTemplates.find((t) => t.id === bestMatch) ?? onboardingTemplates[4]
}
