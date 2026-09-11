export interface TutorialStep {
  title: string
  body: string
}

export interface Tutorial {
  slug: string
  title: string
  summary: string
  minutes: number
  steps: TutorialStep[]
}

export const tutorials: Tutorial[] = [
  {
    slug: 'getting-started',
    title: 'Getting started: import your first assets',
    summary: 'Go from an empty workspace to a searchable asset register.',
    minutes: 5,
    steps: [
      {
        title: 'Create your workspace',
        body: 'Sign up and name your workspace. This is the container for every asset, location, and team member you add.',
      },
      {
        title: 'Import your existing list',
        body: 'Upload a CSV of your current spreadsheet or asset list. Map your columns to AssetGriffin fields \u2014 name, category, location, and cost are the minimum needed to get started.',
      },
      {
        title: 'Review the import',
        body: 'Check the import summary for skipped rows or fields that didn\u2019t map cleanly, and fix them before confirming. This is the easiest point to catch duplicate IDs.',
      },
      {
        title: 'Confirm and explore',
        body: 'Once confirmed, your assets appear in the register, searchable and filterable immediately. From here, the next step is usually generating tags for physical scanning.',
      },
    ],
  },
  {
    slug: 'scanning-assets-in-the-field',
    title: 'Scanning assets in the field',
    summary: 'Check assets in and out using a phone camera \u2014 no dedicated scanner required.',
    minutes: 4,
    steps: [
      {
        title: 'Generate and print tags',
        body: 'Use the tag generator to create a unique QR code per asset, sized for your label stock. Print and apply one tag per physical item.',
      },
      {
        title: 'Open the mobile scanner',
        body: 'From any phone browser, open the scan view. No app install is required \u2014 it uses the camera directly.',
      },
      {
        title: 'Scan to check out',
        body: 'Point the camera at the tag. The asset record opens instantly, and you can assign it to yourself or a coworker with one tap.',
      },
      {
        title: 'Scan again to check in',
        body: 'When the asset comes back, scan the same tag and select "check in." The location and status update immediately, and the change is logged to the audit trail automatically.',
      },
    ],
  },
  {
    slug: 'setting-up-maintenance-schedules',
    title: 'Setting up a maintenance schedule',
    summary: 'Turn a manufacturer service interval into automatic reminders.',
    minutes: 5,
    steps: [
      {
        title: 'Open the asset\u2019s maintenance tab',
        body: 'From any asset record, go to the maintenance tab to see its service history and set up a new schedule.',
      },
      {
        title: 'Choose a trigger type',
        body: 'Pick calendar-based (every N days), usage-based (every N operating hours), or meter-based (every N miles), depending on how the asset actually wears.',
      },
      {
        title: 'Set the interval and assign an owner',
        body: 'Enter the manufacturer-recommended interval and assign the technician or team responsible for the service. They\u2019ll see it on their due-soon list automatically.',
      },
      {
        title: 'Log completed service',
        body: 'When the service happens, log it against the asset with notes and cost. The next due date recalculates automatically from the interval you set.',
      },
    ],
  },
  {
    slug: 'running-an-audit',
    title: 'Running a physical audit',
    summary: 'Walk a location and reconcile it against your register in one pass.',
    minutes: 4,
    steps: [
      {
        title: 'Start a new audit',
        body: 'Select the location or category you\u2019re auditing. This generates a checklist of every asset expected to be there.',
      },
      {
        title: 'Scan each asset as you go',
        body: 'Walk the location and scan each tag. Found assets are marked automatically \u2014 there\u2019s no need to search a printed list.',
      },
      {
        title: 'Flag discrepancies on the spot',
        body: 'If an asset\u2019s condition or location has changed, update it right from the scan screen so the record reflects reality immediately, not after the fact.',
      },
      {
        title: 'Review what wasn\u2019t found',
        body: 'When the audit closes, review the "not found" list. Flag these for a follow-up check next cycle rather than removing them immediately.',
      },
    ],
  },
  {
    slug: 'inviting-your-team',
    title: 'Inviting your team and setting permissions',
    summary: 'Add teammates and give them exactly the access their role needs.',
    minutes: 3,
    steps: [
      {
        title: 'Send an invite',
        body: 'From workspace settings, invite a teammate by email. They\u2019ll get a link to set up their own login.',
      },
      {
        title: 'Assign a role',
        body: 'Choose from existing roles like technician, site manager, or admin \u2014 or create a custom role if none of the defaults fit.',
      },
      {
        title: 'Scope their access',
        body: 'Restrict a role to specific locations or categories if they only need to work with a subset of your inventory.',
      },
      {
        title: 'Confirm what they can see',
        body: 'Log in as a test or ask the new teammate to confirm their view matches expectations \u2014 catching an overly broad or narrow role early saves a support request later.',
      },
    ],
  },
]

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find((tutorial) => tutorial.slug === slug)
}
