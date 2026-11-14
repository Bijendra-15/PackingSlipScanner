import { apiClient } from '@/lib/apiClient'
import { PackSlip, CreatePackSlip, UpdatePackSlip, PaginatedResponse, ScanRequest, ScanResponse } from '@/types/packSlip'

export const packSlipApi = {
  async getAll(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse> {
    return apiClient.get<PaginatedResponse>('/packslips', { params })
  },

  async getByNumber(slipNumber: string): Promise<PackSlip> {
    return apiClient.get<PackSlip>(`/packslips/${encodeURIComponent(slipNumber)}`)
  },

  async create(data: CreatePackSlip): Promise<PackSlip> {
    return apiClient.post<PackSlip>('/packslips', data)
  },

  async update(id: string, data: UpdatePackSlip): Promise<PackSlip> {
    return apiClient.put<PackSlip>(`/packslips/${id}`, data)
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/packslips/${id}`)
  },

  async scan(data: ScanRequest): Promise<ScanResponse> {
    return apiClient.post<ScanResponse>('/packslips/scan', data)
  },
}