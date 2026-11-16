import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, toastMessage } from '@/components/Toast'
import { useNavigate } from 'react-router-dom'

interface LogoutResponse {
  Data?: string
}

export async function callLogoutApi(
  userName: string,
  password: string
): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>('/Logout', {
    UserName: userName,
    Password: password,
  })
}

export function useLogout() {
  const { user, logout: clearAuth } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogout = async () => {
    try {
      const stored = (user ?? {}) as { UserName?: string; Password?: string }
      if (stored.UserName && stored.Password) {
        await callLogoutApi(stored.UserName, stored.Password)
      }
    } catch {
      // ignore network errors during logout
    } finally {
      toastMessage(toast, 'Logged Out Successfully.', '1')
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return handleLogout
}
