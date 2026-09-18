import {
  Activity,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Home,
  LayoutGrid,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  boxes: Boxes,
  users: Users,
  home: Home,
  wrench: Wrench,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  activity: Activity,
}

export function groupIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutGrid
}

export function slugifyGroupName(name: string): string {
  const slug = name
    .trim()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 48)
    .replace(/^-+|-+$/g, '')

  if (!slug) {
    throw new Error('Group name must contain at least one letter or number (A–Z, 0–9).')
  }

  return slug
}
