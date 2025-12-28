'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { Auth } from 'aws-amplify'
import { getUsuarios, UsuarioTypeResponse } from './api/usuarios'

export const USUARIO_STORAGE_KEY = 'kairo-lite-usuario'

type StoredUsuarioData = {
  usuarioId: number | null
  usuario: UsuarioTypeResponse | null
  rol: 'admin' | 'vendedor' | 'bodega' | 'master' | null
  timestamp: number
}

type UsuarioContextType = {
  // Estado
  usuarioId: number | null
  usuario: UsuarioTypeResponse | null
  rol: 'admin' | 'vendedor' | 'bodega' | 'master' | null
  isMaster: boolean
  loading: boolean

  // Acciones
  setUsuarioId: (id: number | null) => void
  fetchAndSaveUserInfo: () => Promise<void>
  clearUserCache: () => void
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined)

const getStoredUsuario = (): StoredUsuarioData | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const saved = window.sessionStorage.getItem(USUARIO_STORAGE_KEY)
    if (!saved) return null

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return null

    // Verificar que no sea muy antiguo (más de 5 minutos)
    const maxAge = 5 * 60 * 1000 // 5 minutos
    const now = Date.now()
    if (parsed.timestamp && now - parsed.timestamp >= maxAge) {
      return null
    }

    // Estructura nueva con usuario completo
    if (parsed.usuario && parsed.rol !== undefined) {
      return {
        usuarioId: parsed.usuario?.id || parsed.usuarioId || null,
        usuario: parsed.usuario,
        rol: parsed.rol,
        timestamp: parsed.timestamp || now,
      }
    }

    // Estructura antigua (solo usuarioId) - migración
    if (parsed.usuarioId !== undefined && parsed.usuario === undefined) {
      return {
        usuarioId: parsed.usuarioId,
        usuario: null,
        rol: null,
        timestamp: now,
      }
    }

    return null
  } catch (e) {
    console.error('Error leyendo usuario desde sessionStorage', e)
    return null
  }
}

const saveUsuarioToStorage = (data: StoredUsuarioData | null) => {
  if (typeof window === 'undefined') return

  try {
    if (!data || (!data.usuario && data.usuarioId === null)) {
      // Si no hay datos o todo es null, eliminar la key
      window.sessionStorage.removeItem(USUARIO_STORAGE_KEY)
      return
    }

    const dataToSave = {
      usuarioId: data.usuarioId,
      usuario: data.usuario,
      rol: data.rol,
      timestamp: Date.now(),
    }

    window.sessionStorage.setItem(
      USUARIO_STORAGE_KEY,
      JSON.stringify(dataToSave)
    )
  } catch (e) {
    console.error('Error guardando usuario en sessionStorage', e)
  }
}

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const initial = getStoredUsuario()

  const [usuarioId, setUsuarioIdState] = useState<number | null>(
    initial?.usuarioId || null
  )
  const [usuario, setUsuarioState] = useState<UsuarioTypeResponse | null>(
    initial?.usuario || null
  )
  const [rol, setRolState] = useState<
    'admin' | 'vendedor' | 'bodega' | 'master' | null
  >(initial?.rol || null)
  const [loading, setLoading] = useState(!initial)

  // Persistir cambios en sessionStorage
  useEffect(() => {
    const data: StoredUsuarioData = {
      usuarioId: usuario?.id || usuarioId,
      usuario,
      rol,
      timestamp: Date.now(),
    }
    saveUsuarioToStorage(data)
  }, [usuarioId, usuario, rol])

  // Función para consultar y guardar información del usuario desde la BD
  const fetchAndSaveUserInfo = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // Obtener email del usuario autenticado desde Cognito
      const currentUser = await Auth.currentAuthenticatedUser()
      const email = currentUser.attributes?.email || currentUser.username

      if (!email) {
        console.warn('No se pudo obtener el email del usuario autenticado')
        setLoading(false)
        return
      }

      // Buscar usuario en la BD por email
      const usuarios = await getUsuarios({ email })

      if (usuarios && usuarios.length > 0) {
        const usuarioEncontrado = usuarios[0]
        setUsuarioState(usuarioEncontrado)
        setUsuarioIdState(usuarioEncontrado.id)
        setRolState(usuarioEncontrado.rol)
      } else {
        // Si no se encuentra el usuario, limpiar todo
        setUsuarioState(null)
        setUsuarioIdState(null)
        setRolState(null)
      }
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error)
      // En caso de error, limpiar todo
      setUsuarioState(null)
      setUsuarioIdState(null)
      setRolState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar información del usuario al montar si no hay datos en storage
  useEffect(() => {
    const loadUserIfNeeded = async () => {
      if (!initial) {
        // Verificar si hay una sesión activa de Cognito
        try {
          await Auth.currentAuthenticatedUser()
          // Si hay sesión activa, cargar información del usuario
          await fetchAndSaveUserInfo()
        } catch (error) {
          // No hay sesión activa, no hacer nada
        }
      }
    }
    loadUserIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSaveUserInfo]) // Dependencia: fetchAndSaveUserInfo

  // Función para limpiar el cache
  const clearUserCache = useCallback(() => {
    setUsuarioState(null)
    setUsuarioIdState(null)
    setRolState(null)
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(USUARIO_STORAGE_KEY)
      } catch (e) {
        console.error('Error limpiando cache de usuario', e)
      }
    }
  }, [])

  const setUsuarioId = useCallback(
    (id: number | null) => {
      setUsuarioIdState(id)
      // Si se establece un ID pero no hay usuario, intentar buscar el usuario
      // (esto mantiene compatibilidad con código que solo usa usuarioId)
      if (id && !usuario) {
        // No hacer nada automáticamente, el usuario debería usar fetchAndSaveUserInfo
      }
    },
    [usuario]
  )

  const isMaster = rol === 'master'

  const value: UsuarioContextType = {
    usuarioId,
    usuario,
    rol,
    isMaster,
    loading,
    setUsuarioId,
    fetchAndSaveUserInfo,
    clearUserCache,
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

// Hook de conveniencia para obtener información del usuario actual
// Este hook usa el contexto y es más semántico que useUsuario
export const useCurrentUser = () => {
  const ctx = useUsuario()
  return {
    usuario: ctx.usuario,
    rol: ctx.rol,
    isMaster: ctx.isMaster,
    loading: ctx.loading,
    usuarioId: ctx.usuarioId,
  }
}
