'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { HeaderProvider, useHeader } from './HeaderContext'
import { SidebarProvider, useSidebar } from './SidebarContext'

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isHeaderVisible } = useHeader()
  const { isSidebarExpanded } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <Header />
      <main 
        className="relative z-10 transition-all duration-300"
        style={{
          // Sur mobile : pas de marge gauche (sidebar en overlay cachée par défaut)
          // Sur desktop : marge selon l'état de la sidebar
          marginLeft: isMobile ? '0' : (isSidebarExpanded ? '256px' : '80px'),
          // Padding top selon la visibilité du header
          paddingTop: isMobile 
            ? '4.5rem' // Header toujours visible sur mobile
            : (isHeaderVisible ? '4rem' : '1.5rem'),
          paddingLeft: isMobile ? '1rem' : '0',
          paddingRight: isMobile ? '1rem' : '0',
        }}
      >
        {children}
      </main>
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderProvider>
      <SidebarProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
      </SidebarProvider>
    </HeaderProvider>
  )
}

