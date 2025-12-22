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
      // Mobile: < 768px, Tablet: 768px - 1023px, Desktop: >= 1024px
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundColor: '#000000',
      }}
    >
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
            ? '4rem' // Header toujours visible sur mobile (réduit car header plus compact)
            : (isHeaderVisible ? '4rem' : '1.5rem'),
          paddingLeft: isMobile ? '0.75rem' : '0',
          paddingRight: isMobile ? '0.75rem' : '0',
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

