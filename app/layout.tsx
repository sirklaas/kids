import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/sidebar/Sidebar'

export const metadata: Metadata = {
  title: 'Kids Studio',
  description: 'YouTube video production dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
