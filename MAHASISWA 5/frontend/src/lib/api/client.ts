import axios from "axios"
import { getToken, clearSession } from "@/lib/auth"

// Ganti sesuai base URL backend (M2) saat sudah tersedia
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
