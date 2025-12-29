'use client'

import { createContext, useContext, useState, useMemo, useCallback } from 'react'

interface SidebarContextType {
  isSidebarExpanded: boolean
  setIsSidebarExpanded: (expanded: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  // Mémoriser setIsSidebarExpanded pour éviter les changements de référence
  const setIsSidebarExpandedMemo = useCallback((expanded: boolean) => {
    setIsSidebarExpanded(expanded)
  }, [])

  // Mémoriser la valeur du contexte pour éviter les re-renders inutiles
  const value = useMemo(() => ({
    isSidebarExpanded,
    setIsSidebarExpanded: setIsSidebarExpandedMemo,
  }), [isSidebarExpanded, setIsSidebarExpandedMemo])

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}







