'use client'

import { createContext, useContext, useState } from 'react'

interface HeaderContextType {
  isHeaderVisible: boolean
  setIsHeaderVisible: (visible: boolean) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)

  return (
    <HeaderContext.Provider value={{ isHeaderVisible, setIsHeaderVisible }}>
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


