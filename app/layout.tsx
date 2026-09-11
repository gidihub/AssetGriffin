import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Rubik, Roboto_Mono } from 'next/font/google'
import './globals.css'

const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' })

export const metadata: Metadata = {
  title: 'AssetGriffin — Asset tracking that scales with you, free to start',
  description: 'Track unlimited assets and unlimited users with AssetGriffin. No per-seat pricing, no surprise fees when you outgrow the free tier.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f7f4',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${rubik.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
