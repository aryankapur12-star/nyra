import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nyra — Never Miss a Bill Again',
  description: 'Nyra is your personal bill reminder app. Get SMS reminders before bills are due, track payments, and never pay a late fee again.',
  keywords: ['bill reminder', 'bill tracker', 'payment reminder', 'SMS reminders', 'late fee prevention', 'personal finance', 'Canada'],
  authors: [{ name: 'Nyra' }],
  creator: 'Nyra',
  metadataBase: new URL('https://www.nyra-app.ca'),
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://www.nyra-app.ca',
    siteName: 'Nyra',
    title: 'Nyra — Never Miss a Bill Again',
    description: 'Get SMS reminders before bills are due. Track payments, earn badges, and never pay a late fee again.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nyra - Never Miss a Bill Again',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nyra — Never Miss a Bill Again',
    description: 'Get SMS reminders before bills are due. Track payments, earn badges, and never pay a late fee again.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
