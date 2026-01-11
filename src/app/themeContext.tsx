'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type ThemeMode = 'light' | 'dark'

type ThemeContextType = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const THEME_STORAGE_KEY = 'kairo-lite-theme'

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const saved = window.sessionStorage.getItem(THEME_STORAGE_KEY)
    if (!saved) return 'light'

    const parsed = saved as ThemeMode
    if (parsed === 'dark' || parsed === 'light') {
      return parsed
    }

    return 'light'
  } catch (e) {
    console.error('Error leyendo tema desde sessionStorage', e)
    return 'light'
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const initial = getStoredTheme()
  const [theme, setThemeState] = useState<ThemeMode>(initial)

  // Persistir cambios en sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (e) {
      console.error('Error guardando tema en sessionStorage', e)
    }
  }, [theme])

  // Aplicar tema al documento HTML
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return ctx
}

