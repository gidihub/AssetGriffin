'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  ClipboardCheck,
  Eye,
  FileSearch,
  History,
  Lock,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import {
  AUTH_PROMO_BADGE_POSITIONS,
  AUTH_PROMO_SLIDE_INTERVAL_MS,
  AUTH_PROMO_SLIDES,
  type AuthPromoIconName,
} from '@/lib/auth-promo-slides'

const ICON_MAP: Record<AuthPromoIconName, LucideIcon> = {
  building: Building2,
  sparkles: Sparkles,
  'shield-check': ShieldCheck,
  'chart-bar': BarChart3,
  wrench: Wrench,
  'clipboard-check': ClipboardCheck,
  calendar: Calendar,
  'alert-triangle': AlertTriangle,
  'bar-chart': BarChart3,
  'file-search': FileSearch,
  lock: Lock,
  history: History,
  search: Search,
  eye: Eye,
}

export function LoginPromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [progressKey, setProgressKey] = useState(0)

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index)
    setProgressKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!playing) return

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % AUTH_PROMO_SLIDES.length)
      setProgressKey((key) => key + 1)
    }, AUTH_PROMO_SLIDE_INTERVAL_MS)

    return () => window.clearTimeout(timeout)
  }, [playing, activeIndex])

  return (
    <div className="auth-promo">
      <div className="auth-promo-stage" aria-live="polite">
        {AUTH_PROMO_SLIDES.map((item, index) => {
          const isActive = index === activeIndex
          return (
            <article
              key={item.id}
              className={`auth-promo-slide${isActive ? ' is-active' : ''}`}
              aria-hidden={!isActive}
              inert={isActive ? undefined : true}
            >
              <div className="auth-promo-slide-layout">
                <div className="auth-promo-copy">
                  <p className="auth-promo-label">{item.label}</p>
                  <h2 className="auth-promo-headline">{item.headline}</h2>
                  <p className="auth-promo-body">{item.body}</p>
                  <Link
                    href={item.linkHref}
                    className="auth-promo-link"
                    tabIndex={isActive ? 0 : -1}
                  >
                    {item.linkLabel}
                  </Link>
                </div>

                <div className="auth-promo-badges" aria-hidden>
                  {item.icons.map((iconName, badgeIndex) => {
                    const Icon = ICON_MAP[iconName]
                    const { size = 'md', ...position } =
                      AUTH_PROMO_BADGE_POSITIONS[badgeIndex] ?? { size: 'md' }
                    const iconSize = size === 'lg' ? 20 : size === 'sm' ? 15 : 17
                    return (
                      <span
                        key={`${item.id}-${iconName}-${badgeIndex}`}
                        className={`auth-promo-badge auth-promo-badge--${size}`}
                        style={{
                          ...position,
                          animationDelay: `${badgeIndex * -1.4}s`,
                        }}
                      >
                        <Icon size={iconSize} strokeWidth={1.75} />
                      </span>
                    )
                  })}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="auth-promo-controls">
        <div className="auth-promo-dots" role="tablist" aria-label="Promotional slides">
          {AUTH_PROMO_SLIDES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Slide ${index + 1}: ${item.headline}`}
              className={`auth-promo-dot${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        <div className="auth-promo-progress-wrap">
          <div
            key={progressKey}
            className="auth-promo-progress-fill"
            style={{
              animationDuration: `${AUTH_PROMO_SLIDE_INTERVAL_MS}ms`,
              animationPlayState: playing ? 'running' : 'paused',
            }}
          />
        </div>

        <button
          type="button"
          className="auth-promo-play-toggle"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? 'Pause slide rotation' : 'Resume slide rotation'}
          aria-pressed={playing}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  )
}
