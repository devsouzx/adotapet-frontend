import type { ApiError, Page } from '../types/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

function friendlyMessage(status: number, message?: string): string {
  if (status === 400 || status === 422) return message || 'Confira os dados informados e tente novamente.'
  if (status === 401) return 'Sua sessão expirou ou seus dados de acesso são inválidos. Entre novamente.'
  if (status === 403) return 'Você não tem permissão para realizar esta ação.'
  if (status === 404) return 'Não encontramos este registro. Ele pode ter sido removido.'
  if (status === 409) return message || 'Esta ação conflita com informações já cadastradas.'
  if (status === 429) return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.'
  if (status >= 500) return 'O servidor encontrou um problema. Tente novamente em alguns minutos.'
  return message || 'Não foi possível concluir a solicitação.'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adotapet_token')
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError('A solicitação demorou mais que o esperado. Tente novamente.')
    }
    throw new ApiRequestError('Não foi possível conectar ao AdotaPet. Verifique sua conexão e tente novamente.')
  } finally {
    window.clearTimeout(timeout)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  let body: unknown
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
  }
  if (!response.ok) {
    const apiError = body && typeof body === 'object' ? (body as Partial<ApiError>) : undefined
    const message = friendlyMessage(response.status, apiError?.message)
    if (response.status === 401) {
      localStorage.removeItem('adotapet_token')
      localStorage.removeItem('adotapet_name')
      window.dispatchEvent(new Event('adotapet:unauthorized'))
    }
    throw new ApiRequestError(message, response.status, apiError?.code, apiError?.details)
  }
  return body as T
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
})

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, json('POST', data)),
  put: <T>(path: string, data?: unknown) => request<T>(path, json('PUT', data)),
  patch: <T>(path: string, data?: unknown) => request<T>(path, json('PATCH', data)),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function queryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

export function emptyPage<T>(size = 10): Page<T> {
  return { content: [], number: 0, size, totalElements: 0, totalPages: 0, first: true, last: true, empty: true }
}
