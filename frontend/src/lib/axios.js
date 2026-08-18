import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Get role from URL or default to 'rider'
const getRoleFromUrl = () => {
  if (typeof window === 'undefined') return 'rider'

  const port = window.location.port
  console.log('=== PORT DETECTION ===')
  console.log('Current port:', port)
  console.log('Window location:', window.location)
  console.log('=== END PORT DETECTION ===')

  if (port === '6001') return 'driver' // Changed from 6000 to 6001
  if (port === '7001') return 'admin'
  return 'rider' // default
}

const getStorageKey = () => {
  const role = getRoleFromUrl()
  console.log('Storage key role:', role); // Debug log
  return `auth-storage-${role}`
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
})

api.interceptors.request.use((config) => {
  console.log('=== AXIOS REQUEST INTERCEPTOR ===')
  console.log('Request URL:', config.url)
  console.log('Request method:', config.method)

  const storageKey = getStorageKey()
  console.log('Storage key:', storageKey)

  // Use sessionStorage instead of localStorage
  const token = sessionStorage.getItem(`${storageKey}-token`)
  console.log('Token from sessionStorage:', token ? 'Token exists' : 'No token')
  console.log('All sessionStorage keys:', Object.keys(sessionStorage))

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Authorization header set')
  } else {
    console.log('No token found, not setting Authorization header')
  }

  console.log('Final request config:', config)
  console.log('=== END AXIOS REQUEST INTERCEPTOR ===')
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS RESPONSE INTERCEPTOR ===')
    console.log('Response status:', response.status)
    console.log('Response data:', response.data)
    console.log('=== END AXIOS RESPONSE INTERCEPTOR ===')
    return response
  },
  (error) => {
    console.error('=== AXIOS RESPONSE ERROR INTERCEPTOR ===')
    console.error('Response error:', error)
    console.error('Error response:', error.response)
    console.error('Error message:', error.message)
    console.error('=== END AXIOS RESPONSE ERROR INTERCEPTOR ===')

    if (error.response?.status === 401) {
      console.log('401 Unauthorized, logging out...')
      // Use auth store to logout properly
      useAuthStore.getState().logout()
      // No need to reload, state change will trigger redirect
    }
    return Promise.reject(error)
  }
)

export default api