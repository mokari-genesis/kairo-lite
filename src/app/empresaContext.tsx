'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { EnterpriseType } from '@/app/api/enterprise'

type EmpresaContextType = {
  empresaId: number | null
  empresa: EnterpriseType | null
  setEmpresa: (empresa: EnterpriseType | null) => void
  setEmpresaId: (id: number | null) => void
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

export const EMPRESA_STORAGE_KEY = 'kairo-lite-empresa'

const getStoredEmpresa = () => {
  if (typeof window === 'undefined') {
    return {
      empresaId: null as number | null,
      empresa: null as EnterpriseType | null,
    }
  }

  try {
    const saved = window.sessionStorage.getItem(EMPRESA_STORAGE_KEY)
    if (!saved) return { empresaId: null, empresa: null }

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') {
      return { empresaId: null, empresa: null }
    }

    const rawId = (parsed as any).empresaId
    const empresaId =
      typeof rawId === 'number' ? rawId : rawId ? Number(rawId) : null

    const empresa = (parsed as any).empresa ?? null

    return { empresaId, empresa }
  } catch (e) {
    console.error('Error leyendo empresa desde sessionStorage', e)
    return { empresaId: null, empresa: null }
  }
}

export const EmpresaProvider = ({ children }: { children: ReactNode }) => {
  const initial = getStoredEmpresa()
  const [empresaId, setEmpresaIdState] = useState<number | null>(
    initial.empresaId
  )
  const [empresa, setEmpresaState] = useState<EnterpriseType | null>(
    initial.empresa
  )

  // Persistir cambios
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem(
        EMPRESA_STORAGE_KEY,
        JSON.stringify({ empresaId, empresa })
      )
    } catch (e) {
      console.error('Error guardando empresa en sessionStorage', e)
    }
  }, [empresaId, empresa])

  const setEmpresaId = (id: number | null) => {
    setEmpresaIdState(id)
    if (!id) {
      setEmpresaState(null)
    }
  }

  const setEmpresa = (emp: EnterpriseType | null) => {
    setEmpresaState(emp)
    setEmpresaIdState(emp ? Number(emp.id) : null)
  }

  const value: EmpresaContextType = {
    empresaId,
    empresa,
    setEmpresa,
    setEmpresaId,
  }

  return (
    <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>
  )
}

export const useEmpresa = () => {
  const ctx = useContext(EmpresaContext)
  if (!ctx) {
    throw new Error('useEmpresa debe usarse dentro de un EmpresaProvider')
  }
  return ctx
}
