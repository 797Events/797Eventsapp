import type { Metadata } from 'next'
import Script from 'next/script'
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,
'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '1792312225285930');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=1792312225285930&ev=PageView&noscript=1" alt="" />
        </noscript>
        <ErrorBoundary>
          <RealTimeSync>
            {children}
          </RealTimeSync>
        </ErrorBoundary>
      </body>
    </html>
  )
}
