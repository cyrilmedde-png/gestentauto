import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/modules/core/components/AuthProvider'

export const metadata: Metadata = {
  title: 'SaaS Gestion Entreprise',
  description: 'Application complète de gestion d\'entreprise',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

