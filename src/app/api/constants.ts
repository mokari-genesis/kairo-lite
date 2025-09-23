import { CognitoUserSession } from 'amazon-cognito-identity-js'
import { Auth } from 'aws-amplify'

export type LambdaResponse<T> = {
  data: T
  msg?: string
  message?: string
  status: string
  count?: number
  pageIndex?: number
  pageSize?: number
}
export const fetchApi = async <T>({
  api,
  body,
  method,
  service,
}: {
  api: string
  body?: any
  method: string
  service: string
  customHeaders?: object
}): Promise<T> => {
  let authenticatedUser: CognitoUserSession | null
  let idToken: string = ''

  try {
    authenticatedUser = await Auth.currentSession()
    idToken = authenticatedUser?.getIdToken().getJwtToken()
    console.log('Authentication successful, token length:', idToken.length)
  } catch (err) {
    console.log('Authentication error:', err)
    if (err !== 'No current user') {
      console.log('No user')
    }
  }

  const url = `${api}${service}`
  console.log('Making request to:', url)
  console.log('Request headers:', {
    Authorization: idToken ? `${idToken.substring(0, 20)}...` : 'No token',
  })

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: idToken,
    },
    body: JSON.stringify(body),
  })

  console.log('Response status:', response.status)
  console.log('Response ok:', response.ok)

  const result = await response.json()
  console.log('Response result:', result)

  if (!response.ok || result.status === 'FAILURE') {
    console.error('API Error:', {
      status: response.status,
      message: result.message || result.data?.message || result.msg,
      result,
    })
    throw Error(result.message || result.data?.message || result.msg)
  }

  return result
}
