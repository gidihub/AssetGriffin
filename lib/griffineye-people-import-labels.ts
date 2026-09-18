/** Client-safe labels for people import mapping UI — keep free of server imports. */

export const PEOPLE_IMPORT_FIELD_LABELS = {
  name: 'Name',
  team: 'Team',
  role: 'Role',
  department: 'Department',
  email: 'Email',
  phone: 'Phone',
  status: 'Status',
  last_check_out: 'Last check-out',
  employee_id: 'Employee ID',
  title: 'Title',
  site: 'Site',
  location: 'Location',
  notes: 'Notes',
} as const

export type PeopleImportFieldKey = keyof typeof PEOPLE_IMPORT_FIELD_LABELS
