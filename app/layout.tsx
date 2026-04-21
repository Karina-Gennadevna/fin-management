import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Финансы — управление личными деньгами',
  description: 'Личный финансовый менеджер',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
