<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">NIK</span>
      <span class="font-mono font-medium text-gray-800 sm:block">{{ data.nik_masked }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Nama (sesuai KTP)</span>
      <span class="font-medium text-gray-800 sm:block">{{ data.full_name_ktp }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Tempat, Tanggal Lahir</span>
      <span class="text-gray-700 sm:block">{{ data.place_of_birth }}, {{ dayjs(data.date_of_birth).format('DD MMM YYYY') }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Jenis Kelamin</span>
      <span class="text-gray-700 sm:block">{{ data.gender === 'MALE' ? 'Laki-laki' : 'Perempuan' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Agama</span>
      <span class="text-gray-700 sm:block">{{ data.religion || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Status Perkawinan</span>
      <span class="text-gray-700 sm:block">{{ data.marital_status || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Pekerjaan</span>
      <span class="text-gray-700 sm:block">{{ data.occupation || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Kewarganegaraan</span>
      <span class="text-gray-700 sm:block">{{ data.nationality || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block sm:col-span-2">
      <span class="text-gray-400">Alamat KTP</span>
      <span class="text-gray-700 sm:block">{{ data.ktp_address }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">RT/RW</span>
      <span class="text-gray-700 sm:block">{{ data.rt || '-' }} / {{ data.rw || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Kelurahan/Kecamatan</span>
      <span class="text-gray-700 sm:block">{{ data.village || '-' }} / {{ data.district || '-' }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Kota/Kabupaten</span>
      <span class="text-gray-700 sm:block">{{ data.city }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Provinsi</span>
      <span class="text-gray-700 sm:block">{{ data.province }}</span>
    </div>
    <div class="flex justify-between sm:block">
      <span class="text-gray-400">Kode Pos</span>
      <span class="text-gray-700 sm:block">{{ data.postal_code || '-' }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { UserVerificationData } from '~/types/verification/UserVerificationData'

defineProps<{
  data: UserVerificationRequest | UserVerificationData
}>()
</script>
