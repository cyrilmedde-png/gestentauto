'use client'

import { useState, useEffect, useMemo } from 'react'
import { SidebarModular } from './SidebarModular'
import { Header } from './Header'
import { HeaderProvider, useHeader } from './HeaderContext'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { NotificationToast } from '@/components/notifications/NotificationToast'
import React from 'react'

// Mémoriser MainLayoutContent pour éviter les remontages inutiles
const MainLayoutContent = React.memo(({ children }: { children: React.ReactNode }) => {
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

  // Mémoriser le style pour éviter les recalculs
  const mainStyle = useMemo(() => ({
    marginLeft: isMobile ? '0' : (isSidebarExpanded ? '256px' : '80px'),
    paddingTop: isMobile 
      ? '4rem'
      : (isHeaderVisible ? '4rem' : '1.5rem'),
    paddingLeft: isMobile ? '0.75rem' : '0',
    paddingRight: isMobile ? '0.75rem' : '0',
  }), [isMobile, isSidebarExpanded, isHeaderVisible])

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundColor: '#000000',
      }}
    >
      <SidebarModular />
      <Header />
      <NotificationToast />
      <main 
        className="relative z-10 transition-all duration-300"
        style={mainStyle}
      >
        {children}
      </main>
    </div>
  )
})

MainLayoutContent.displayName = 'MainLayoutContent'

// Mémoriser les providers pour éviter les recréations
const MemoizedHeaderProvider = React.memo(HeaderProvider)
const MemoizedSidebarProvider = React.memo(SidebarProvider)

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemoizedHeaderProvider>
      <MemoizedSidebarProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
      </MemoizedSidebarProvider>
    </MemoizedHeaderProvider>
  )
}

