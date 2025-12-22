'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type UsuarioContextType = {
  usuarioId: number | null
  setUsuarioId: (id: number | null) => void
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined)

export const USUARIO_STORAGE_KEY = 'kairo-lite-usuario'

const getStoredUsuario = () => {
  if (typeof window === 'undefined') {
    return {
      usuarioId: null as number | null,
    }
  }

  try {
    const saved = window.sessionStorage.getItem(USUARIO_STORAGE_KEY)
    if (!saved) {
      // Valor por defecto temporal hasta que se implemente autenticación completa
      return { usuarioId: 1 }
    }

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') {
      return { usuarioId: 1 }
    }

    const rawId = (parsed as any).usuarioId
    const usuarioId =
      typeof rawId === 'number' ? rawId : rawId ? Number(rawId) : 1

    return { usuarioId }
  } catch (e) {
    console.error('Error leyendo usuario desde sessionStorage', e)
    return { usuarioId: 1 }
  }
}

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const initial = getStoredUsuario()
  const [usuarioId, setUsuarioIdState] = useState<number | null>(
    initial.usuarioId
  )

  // Persistir cambios
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem(
        USUARIO_STORAGE_KEY,
        JSON.stringify({ usuarioId })
      )
    } catch (e) {
      console.error('Error guardando usuario en sessionStorage', e)
    }
  }, [usuarioId])

  const setUsuarioId = (id: number | null) => {
    setUsuarioIdState(id || 1) // Fallback a 1 si es null
  }

  const value: UsuarioContextType = {
    usuarioId,
    setUsuarioId,
  }

  return (
    <UsuarioContext.Provider value={value}>{children}</UsuarioContext.Provider>
  )
}

export const useUsuario = () => {
  const ctx = useContext(UsuarioContext)
  if (!ctx) {
    throw new Error('useUsuario debe usarse dentro de un UsuarioProvider')
  }
  return ctx
}
