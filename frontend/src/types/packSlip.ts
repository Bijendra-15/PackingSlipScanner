import { z } from 'zod'

export const PackSlipSchema = z.object({
  id: z.string().uuid(),
  slipNumber: z.string().min(1, 'Slip number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  orderNumber: z.string().optional(),
  status: z.enum(['pending', 'picked', 'packed', 'shipped', 'cancelled']),
  items: z.array(z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    location: z.string().optional(),
  })).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type PackSlip = z.infer<typeof PackSlipSchema>

export const CreatePackSlipSchema = PackSlipSchema.pick({
  slipNumber: true,
  customerName: true,
  orderNumber: true,
  status: true,
  items: true,
})

export type CreatePackSlip = z.infer<typeof CreatePackSlipSchema>

export const UpdatePackSlipSchema = PackSlipSchema.pick({
  customerName: true,
  orderNumber: true,
  status: true,
  items: true,
}).partial()

export type UpdatePackSlip = z.infer<typeof UpdatePackSlipSchema>

export const PaginatedResponseSchema = z.object({
  data: z.array(PackSlipSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasNext: z.boolean(),
})

export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>

export const ScanRequestSchema = z.object({
  slipNumber: z.string().min(1, 'Slip number is required'),
  location: z.string().optional(),
})

export type ScanRequest = z.infer<typeof ScanRequestSchema>

export const ScanResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  slip: PackSlipSchema,
})

export type ScanResponse = z.infer<typeof ScanResponseSchema>