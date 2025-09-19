
import { useCookie } from '#app'


export const useAuth = () => {
  const token = useCookie<string | null>('token', { sameSite: 'strict' })

  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const clearToken = () => {
    token.value = null
  }

  return { token, setToken, clearToken }
}

// Validasi ke server
export const validateToken = async (api) => {
  const { token, clearToken } = useAuth()

  if (!token.value) return false

  try {
    const res = await $fetch(api+'/user/validate-token', {
      headers: { 'X-API-TOKEN': `${token.value}` }
    })

    console.log("VALIDATE TOKEN");
    return res.status === 'success'
  } catch (e) {
    clearToken()
    return false
  }
}

export const isLoggedIn = () =>{
  if(validateToken){}

}

