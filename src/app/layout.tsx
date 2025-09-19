import type { Metadata } from 'next'
import { Poppins, Montserrat } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import RealTimeSync from '@/components/RealTimeSync'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://797events.com'),
  title: '797events - Premium Event Management',
  description: 'Your Vision...Our Innovation - Premium event experiences and ticket booking',
  keywords: 'events, wedding, party, management, booking, tickets, 797events',
  authors: [{ name: '797 Events', url: 'https://797events.com' }],
  creator: '797 Events',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://797events.com',
    siteName: '797 Events',
    title: '797events - Premium Event Management',
    description: 'Your Vision...Our Innovation - Premium event experiences and ticket booking',
  },
  twitter: {
    card: 'summary_large_image',
    title: '797events - Premium Event Management',
    description: 'Your Vision...Our Innovation - Premium event experiences and ticket booking',
  },
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body className={`${poppins.variable} ${montserrat.variable}`}>
        <ErrorBoundary>
          <RealTimeSync>
            {children}
          </RealTimeSync>
        </ErrorBoundary>
      </body>
    </html>
  )
}