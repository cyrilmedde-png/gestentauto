'use client'

import { createContext, useContext, useState, useMemo, useCallback } from 'react'

interface HeaderContextType {
  isHeaderVisible: boolean
  setIsHeaderVisible: (visible: boolean) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)

  // Mémoriser setIsHeaderVisible pour éviter les changements de référence
  const setIsHeaderVisibleMemo = useCallback((visible: boolean) => {
    setIsHeaderVisible(visible)
  }, [])

  // Mémoriser la valeur du contexte pour éviter les re-renders inutiles
  const value = useMemo(() => ({
    isHeaderVisible,
    setIsHeaderVisible: setIsHeaderVisibleMemo,
  }), [isHeaderVisible, setIsHeaderVisibleMemo])

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}







