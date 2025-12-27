// Layout pour forcer le rendu dynamique de /platform/make
// Même si les composants enfants sont des client components,
// ce layout force Next.js à ne pas pré-rendre statiquement

import { unstable_noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export default function MakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Forcer le rendu dynamique
  unstable_noStore()
  
  return <>{children}</>
}

