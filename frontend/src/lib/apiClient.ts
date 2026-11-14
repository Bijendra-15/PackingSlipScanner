import { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import axios from 'axios'

/**
 * Resolves the base API URL.
 *
 * The original application stored the domain encrypted inside
 * `sessionStorage` and decrypted it on every request. We replicate that
 * behaviour so the runtime value matches the legacy flow.
 */
function resolveBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__API_BASE__) {
    return (window as any).__API_BASE__
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5181/api'
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export class HttpClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: resolveBaseUrl(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        // Re-resolve the base URL on each request in case sessionStorage changed
        this.instance.defaults.baseURL = resolveBaseUrl()
        return config
      },
      (error) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(this.normalizeError(error))
      }
    )
  }

  private normalizeError(error: AxiosError): ApiError {
    const response = error.response
    if (response?.data) {
      const data = response.data as Record<string, unknown>
      return {
        message: (data.message as string) || error.message,
        status: response.status,
        code: (data.code as string) || error.code,
      }
    }
    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code,
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new HttpClient()