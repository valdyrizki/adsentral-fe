import type { AccountTypeStatus } from './AccountTypeResponse'

export interface AccountTypeRequest {
  name: string
  status?: AccountTypeStatus
}
