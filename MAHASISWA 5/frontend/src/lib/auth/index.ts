// Helper autentikasi sederhana untuk prototype.
// Untuk production: pertimbangkan httpOnly cookie, bukan localStorage.

export type UserRole = "USER" | "MERCHANT" | "ADMIN"

const TOKEN_KEY = "monexa_token"
const ROLE_KEY = "monexa_role"

export function saveSession(token: string, role: UserRole) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRole(): UserRole | null {
  return (localStorage.getItem(ROLE_KEY) as UserRole) ?? null
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}
