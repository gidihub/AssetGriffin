'use client'

import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Columns3,
  CreditCard,
  FolderKanban,
  KeyRound,
  Palette,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  UserRound,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'

export type SettingsNavItem = {
  label: string
  icon: React.ComponentType<{ size?: number }>
}

export type SettingsNavGroup = {
  title: string
  items: SettingsNavItem[]
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    title: 'Account',
    items: [
      { label: 'Profile', icon: UserRound },
      { label: 'Billing', icon: CreditCard },
      { label: 'Notifications', icon: Bell },
      { label: 'Preferences', icon: SlidersHorizontal },
      { label: 'Security', icon: ShieldCheck },
      { label: 'Integrations', icon: Plug },
      { label: 'Developer', icon: Terminal },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Branding', icon: Palette },
      { label: 'Spending limits', icon: Wallet },
      { label: 'Roles & permissions', icon: KeyRound },
      { label: 'Approval groups', icon: CheckCircle2 },
      { label: 'Groups', icon: FolderKanban },
      { label: 'Fields', icon: Columns3 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Team', icon: Users },
      { label: 'Departments', icon: Building2 },
      { label: 'Workflows', icon: Workflow },
      { label: 'Audit log', icon: ClipboardList },
    ],
  },
]

export const SETTINGS_SECTIONS = SETTINGS_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label))

type SettingsSubnavProps = {
  activeSection: string
  onSelectSection: (section: string) => void
  userName: string
  userEmail: string
  userInitials: string
}

export function SettingsSubnav({
  activeSection,
  onSelectSection,
  userName,
  userEmail,
  userInitials,
}: SettingsSubnavProps) {
  return (
    <nav className="settings-subnav" aria-label="Settings navigation">
      <div className="settings-subnav-profile">
        <div className="settings-subnav-avatar">{userInitials}</div>
        <div className="settings-subnav-user">
          <strong>{userName}</strong>
          <span>{userEmail}</span>
        </div>
      </div>

      {SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.title} className="settings-subnav-group">
          <p className="settings-subnav-label">{group.title}</p>
          <div className="settings-subnav-items">
            {group.items.map(({ label }) => (
              <button
                key={label}
                type="button"
                className={`settings-subnav-item${activeSection === label ? ' is-active' : ''}`}
                aria-current={activeSection === label ? 'page' : undefined}
                onClick={() => onSelectSection(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
