import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yorkstn',
  description: 'Yorkstn test'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{padding:"40px"}}>
          {children}
        </main>
      </body>
    </html>
  )
}
