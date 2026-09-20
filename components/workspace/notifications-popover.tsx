'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Settings2 } from 'lucide-react'
import type { WorkspaceNotification } from '@/lib/workspace-notifications'
import { notificationSignature } from '@/lib/workspace-notifications'

type NotificationsPopoverProps = {
  notifications: WorkspaceNotification[]
  acknowledgedSignature: string
  onAcknowledge: (signature: string) => void
  onSelect: (notification: WorkspaceNotification) => void
  onOpenSettings: () => void
}

export function NotificationsPopover({
  notifications,
  acknowledgedSignature,
  onAcknowledge,
  onSelect,
  onOpenSettings,
}: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const signature = notificationSignature(notifications)
  const hasUnread = notifications.length > 0 && signature !== acknowledgedSignature

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

  function handleToggle() {
    setOpen((current) => {
      const next = !current
      if (next) onAcknowledge(signature)
      return next
    })
  }

  return (
    <div className="notifications-popover-root" ref={rootRef}>
      <button
        type="button"
        className="icon-button notifications-trigger"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        <Bell size={18} />
        {hasUnread ? <span className="notification-dot" aria-hidden /> : null}
      </button>
      {open ? (
        <div className="notifications-popover" role="menu" aria-label="Notifications">
          <div className="notifications-popover-header">
            <strong>Notifications</strong>
            {notifications.length ? (
              <span className="notifications-popover-count">{notifications.length}</span>
            ) : null}
          </div>
          {notifications.length ? (
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`notifications-item notifications-item-${notification.kind}`}
                    onClick={() => {
                      onSelect(notification)
                      setOpen(false)
                    }}
                  >
                    <span className="notifications-item-title">{notification.title}</span>
                    {notification.detail ? (
                      <span className="notifications-item-detail">{notification.detail}</span>
                    ) : null}
                    {notification.time ? (
                      <span className="notifications-item-time">{notification.time}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notifications-empty">You&apos;re all caught up.</p>
          )}
          <div className="notifications-popover-footer">
            <button
              type="button"
              className="notifications-settings-link"
              onClick={() => {
                onOpenSettings()
                setOpen(false)
              }}
            >
              <Settings2 size={14} />
              Notification settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
