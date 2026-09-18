'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronUp, LogOut, Settings2 } from 'lucide-react'
import { logout } from '@/app/login/actions'

type SidebarProfileMenuProps = {
  displayName: string
  role: string
  initials: string
  onAccountSettings: () => void
}

export function SidebarProfileMenu({
  displayName,
  role,
  initials,
  onAccountSettings,
}: SidebarProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="sidebar-profile-menu" ref={rootRef}>
      {open ? (
        <div className="sidebar-profile-popover" role="menu" aria-label="Account menu">
          <p className="sidebar-profile-popover-label">{role}</p>
          <button
            type="button"
            role="menuitem"
            className="sidebar-profile-popover-item"
            onClick={() => {
              onAccountSettings()
              setOpen(false)
            }}
          >
            <Settings2 size={16} />
            Account settings
          </button>
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="sidebar-profile-popover-item sidebar-profile-sign-out"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className="profile-row"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <div className="profile-avatar">{initials}</div>
        <div>
          <strong>{displayName || 'Account'}</strong>
          <span>{role}</span>
        </div>
        <ChevronUp size={16} className={`profile-chevron${open ? ' is-open' : ''}`} aria-hidden />
      </button>
    </div>
  )
}
