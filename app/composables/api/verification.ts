import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { UserVerificationData } from '~/types/verification/UserVerificationData'
import type { VerificationStatusResponse } from '~/types/verification/VerificationStatusResponse'
import type { VerificationSubmitForm } from '~/types/verification/VerificationSubmitForm'
import type { VerificationEditRequest } from '~/types/verification/VerificationEditRequest'

export const useVerificationApi = () => {
  const api = useApi()

  // ===== SELLER =====

  const fetchVerificationStatus = async (): Promise<VerificationStatusResponse> => {
    const res = await api<WebResponse<VerificationStatusResponse>>('/seller/verification/status')
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat status verifikasi' })
    }
    return res.data
  }

  const fetchVerificationHistory = async (): Promise<UserVerificationRequest[]> => {
    const res = await api<WebResponse<UserVerificationRequest[]>>('/seller/verification/history')
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat riwayat verifikasi' })
    }
    return res.data ?? []
  }

  const submitVerification = async (form: VerificationSubmitForm): Promise<UserVerificationRequest> => {
    const formData = new FormData()
    formData.append('nik', form.nik)
    formData.append('fullNameKtp', form.fullNameKtp)
    formData.append('placeOfBirth', form.placeOfBirth)
    formData.append('dateOfBirth', form.dateOfBirth)
    formData.append('gender', form.gender)
    if (form.religion) formData.append('religion', form.religion)
    if (form.maritalStatus) formData.append('maritalStatus', form.maritalStatus)
    if (form.occupation) formData.append('occupation', form.occupation)
    if (form.nationality) formData.append('nationality', form.nationality)
    formData.append('ktpAddress', form.ktpAddress)
    if (form.rt) formData.append('rt', form.rt)
    if (form.rw) formData.append('rw', form.rw)
    if (form.village) formData.append('village', form.village)
    if (form.district) formData.append('district', form.district)
    formData.append('city', form.city)
    formData.append('province', form.province)
    if (form.postalCode) formData.append('postalCode', form.postalCode)
    if (form.ktpPhoto) formData.append('ktpPhoto', form.ktpPhoto)
    if (form.selfieKtpPhoto) formData.append('selfieKtpPhoto', form.selfieKtpPhoto)
    if (form.selfieNotePhoto) formData.append('selfieNotePhoto', form.selfieNotePhoto)

    const res = await api<WebResponse<UserVerificationRequest>>('/seller/verification', {
      method: 'POST',
      body: formData,
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal mengirim data verifikasi' })
    }
    return res.data
  }

  // ===== ADMIN =====

  const fetchAdminVerificationList = async (
    page = 0,
    size = 10,
    status: string = 'ALL',
    email = '',
  ): Promise<PageResponse<UserVerificationRequest>> => {
    const query: Record<string, any> = { page, size }
    if (status !== 'ALL') query.status = status
    if (email.trim()) query.email = email.trim()

    const res = await api<WebResponse<PageResponse<UserVerificationRequest>>>('/admin/verification', { query })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat antrian verifikasi' })
    }
    return res.data
  }

  const fetchAdminVerificationDetail = async (requestId: string): Promise<UserVerificationRequest> => {
    const res = await api<WebResponse<UserVerificationRequest>>(`/admin/verification/${requestId}`)
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat detail verifikasi' })
    }
    return res.data
  }

  const approveVerification = async (requestId: string): Promise<UserVerificationData> => {
    const res = await api<WebResponse<UserVerificationData>>(`/admin/verification/${requestId}/approve`, {
      method: 'PATCH',
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menyetujui verifikasi' })
    }
    return res.data
  }

  const rejectVerification = async (requestId: string, rejectionReason: string): Promise<UserVerificationRequest> => {
    const res = await api<WebResponse<UserVerificationRequest>>(`/admin/verification/${requestId}/reject`, {
      method: 'PATCH',
      body: { rejection_reason: rejectionReason },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menolak verifikasi' })
    }
    return res.data
  }

  const editVerifiedUser = async (userId: number, payload: VerificationEditRequest): Promise<UserVerificationData> => {
    const res = await api<WebResponse<UserVerificationData>>(`/admin/verification/user/${userId}`, {
      method: 'PATCH',
      body: payload,
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memperbarui data verifikasi' })
    }
    return res.data
  }

  return {
    fetchVerificationStatus,
    fetchVerificationHistory,
    submitVerification,
    fetchAdminVerificationList,
    fetchAdminVerificationDetail,
    approveVerification,
    rejectVerification,
    editVerifiedUser,
  }
}
