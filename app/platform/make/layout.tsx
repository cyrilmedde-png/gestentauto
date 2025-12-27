// Layout pour /platform/make
// Pas besoin de forcer le rendu dynamique car la page est maintenant un client component
// Le layout peut rester simple

export default function MakeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

