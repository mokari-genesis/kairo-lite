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
  } catch (err) {
    if (err !== 'No current user') {
      console.log("No user")
    }
  }

  const response = await fetch(`${api}${service}`, {
    method,
    headers: {      
      Authorization: idToken      
    },
    body: JSON.stringify(body),
  })

  const result = await response.json()

  if (!response.ok || result.status === 'FAILURE') {
    throw Error(result.message || result.data?.message || result.msg)
  }

  return result
}
