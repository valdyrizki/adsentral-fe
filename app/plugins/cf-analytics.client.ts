// app/plugins/cf-analytics.client.ts

// Cloudflare Web Analytics hanya di domain production. Staging (dev.adsentral.com) memakai build production yang sama,
// jadi pembedanya dicek saat runtime dari hostname: dulu beacon ikut dimuat di staging sehingga kunjungan penguji
// tercampur ke analitik prod (temuan ZAP EP09-03). Di localhost beacon juga ditolak (token terikat domain prod).
const PRODUCTION_HOSTS = ['adsentral.com', 'www.adsentral.com']

export default defineNuxtPlugin(() => {
  if (!PRODUCTION_HOSTS.includes(window.location.hostname)) return

  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.setAttribute('data-cf-beacon', '{"token": "9408fcaf2e244b2cb4dffe3e2841a6e7"}')
  document.head.appendChild(script)
})
