import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import MenuOverlay from '@/components/MenuOverlay'
import InquiryModal from '@/components/InquiryModal'
import CookieBanner from '@/components/CookieBanner'
import ClientEffects from '@/components/ClientEffects'

export const metadata: Metadata = {
  title: 'Yorkstn | Global Artisanal Brand Expansion into India',
  description: 'Yorkstn is the structured India market entry partner for global artisanal and premium craft brands. Community before commerce.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClientEffects />
        <a className="skip-nav" href="#main-content">Skip to main content</a>
        <div id="cur-d" aria-hidden="true" />
        <div id="cur-r" aria-hidden="true" />
        <div id="grain" aria-hidden="true" />
        <Navbar />
        <MenuOverlay />
        <InquiryModal />
        <CookieBanner />
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
