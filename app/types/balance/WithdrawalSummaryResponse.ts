export interface WithdrawalSummaryResponse {
  pending_count: number
  completed_count: number
  rejected_count: number
  /** Total amount_received withdrawal COMPLETED */
  total_disbursed: number
}
