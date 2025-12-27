// Layout pour forcer le rendu dynamique de /platform/make
// Même si les composants enfants sont des client components,
// ce layout force Next.js à ne pas pré-rendre statiquement

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

