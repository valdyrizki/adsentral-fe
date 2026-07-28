export type CategoryStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPEND'

export interface CategoryRequest {
  name: string
  description?: string | null
  image?: File | null
  status: CategoryStatus
}
