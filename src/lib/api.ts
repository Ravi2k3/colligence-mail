import { clearToken, getToken } from "@/lib/auth"

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  }

  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!skipAuth && response.status === 401) {
    clearToken()
    window.location.reload()
    throw new ApiError(401, "Session expired")
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, body.detail ?? response.statusText)
  }

  return body as T
}

export function get<T>(
  path: string,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return request<T>(path, { method: "GET", ...options })
}

export function post<T>(
  path: string,
  data?: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
    ...options,
  })
}

export function del<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" })
}
