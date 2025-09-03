import { useRouter, usePathname } from 'next/navigation'
import { ComponentType, useEffect, useState } from 'react'
import { Auth } from 'aws-amplify'

export function withAuth<T extends {}>(Component: ComponentType<T>) {
  return function WithAuth(props: React.ComponentProps<ComponentType<T>>) {
    const [allow, setAllow] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const checkIfAuthenticated = async () => {
      try {
        await Auth.currentAuthenticatedUser()
        setAllow(true)
        if (pathname === '/login' || pathname === '/home') {
          router.replace('/home')
        }
      } catch (error) {
        router.replace('/login')
      }
    }

    useEffect(() => {
      checkIfAuthenticated()
    }, [])

    if (!allow && pathname !== '/login') return null
    return <Component {...props} />
  }
}
