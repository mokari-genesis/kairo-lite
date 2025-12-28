import { CognitoUserSession } from 'amazon-cognito-identity-js'
import { Auth } from 'aws-amplify'
import { message } from 'antd'

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
    console.log('Authentication successful, token length:', idToken)
  } catch (err) {
    console.log('Authentication error:', err)
    if (err !== 'No current user') {
      console.log('No user')
    }
  }

  const url = `${api}${service}`

  let response: Response
  let result: any

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: idToken,
      },
      body: JSON.stringify(body),
    })
  } catch (error: any) {
    // Error de conexión de red (WebSocket, fetch, etc.)
    const errorMessage =
      error.message ||
      'Error de conexión. Por favor verifique su conexión a internet.'
    // console.error('Network/WebSocket Error:', {
    //   url,
    //   method,
    //   error: errorMessage,
    //   errorObject: error,
    // })

    // // Mostrar mensaje de error al usuario
    // message.error(errorMessage)

    throw new Error(errorMessage)
  }

  try {
    result = await response.json()
  } catch (error: any) {
    // Error al parsear la respuesta JSON
    const errorMessage =
      error.message || 'Error al procesar la respuesta del servidor.'
    console.error('JSON Parse Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    })
    throw new Error(errorMessage)
  }

  if (!response.ok || result.status === 'FAILURE') {
    const errorMessage =
      result.message ||
      result.data?.message ||
      result.msg ||
      'Error en la solicitud'
    console.error('API Error:', {
      status: response.status,
      message: errorMessage,
      result,
    })

    throw new Error(errorMessage)
  }

  return result
}
