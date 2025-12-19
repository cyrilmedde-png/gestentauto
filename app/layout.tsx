import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestion Entreprise',
  description: 'Application complète de gestion d\'entreprise',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
