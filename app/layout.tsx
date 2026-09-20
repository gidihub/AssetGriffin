import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import {
  ASSET_GRIFFIN_APPLE_ICON,
  ASSET_GRIFFIN_FAVICON_DARK,
  ASSET_GRIFFIN_FAVICON_LIGHT,
  ASSET_GRIFFIN_LOGO,
} from '@/lib/brand-assets'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'AssetGriffin — Asset tracking that scales with you, free to start',
  description: 'Track unlimited assets and unlimited users with AssetGriffin. No per-seat pricing, no surprise fees when you outgrow the free tier.',
  icons: {
    icon: [
      {
        url: ASSET_GRIFFIN_FAVICON_LIGHT,
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: ASSET_GRIFFIN_FAVICON_DARK,
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      {
        url: ASSET_GRIFFIN_APPLE_ICON,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: ASSET_GRIFFIN_LOGO,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#162f2e' },
  ],
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans font-normal antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
