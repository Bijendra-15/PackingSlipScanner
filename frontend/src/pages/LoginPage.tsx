import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, toastMessage } from '@/components/Toast'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Lock, AlertTriangle } from 'lucide-react'

interface LoginResponseData {
  UserId: number
  RoleId: number
  UserName?: string
  AppName?: string
  Password?: string
  [key: string]: unknown
}

interface LoginResponse {
  Data: LoginResponseData | null
  AppName?: string
}

interface LoginCredentials {
  UserName: string
  Password: string
}

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const loginMutation = useMutation({
    mutationFn: (creds: LoginCredentials) =>
      apiClient.post<LoginResponse>('/Login', creds),
    onSuccess: (response) => {
      const data = (response as any).Data ?? (response as any).data
      if (data == null) {
        setError('Unauthorized User!')
        toastMessage(toast, 'Unauthorized User!', '-1')
        return
      }

      const userId = parseInt(String(data.UserId), 10)
      const roleId = parseInt(String(data.RoleId), 10)

      if (userId > 0 && roleId === 15) {
        setAuth(JSON.stringify(data), data)
        navigate('/', { replace: true })
      } else if (userId > 0 && (roleId === 23 || roleId === 24)) {
        setAuth(JSON.stringify(data), data)
        navigate('/finyear', { replace: true })
      } else {
        setError('Unauthorized User!')
        toastMessage(toast, 'Unauthorized User!', '-1')
      }
    },
    onError: () => {
      const msg = 'Invalid User Name Or Password'
      setError(msg)
      toastMessage(toast, msg, '-1')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const iotp = password
    const iusername = username

    if (iotp !== '' && iusername !== '') {
      loginMutation.mutate({ UserName: iusername, Password: iotp })
    } else if (iusername === '' || iusername === null) {
      toastMessage(toast, 'Please Enter Valid User Name.', '-1')
    } else if (iotp === '' || iotp === null) {
      toastMessage(toast, 'Please Enter Password First.', '-1')
    } else {
      toastMessage(toast, 'Invalid User Name Or Password.', '-1')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-md w-full">
<div className="flex items-center justify-center mb-8">
          <img src="/images/logo.png" alt="Logo" className="h-16 w-auto" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <h4 className="text-center font-bold text-slate-900 mb-2">
            Dispatch Generator
          </h4>
          <h4 className="text-center font-bold text-slate-900 mb-6">Login</h4>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="label">
                User Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter user name"
                className="input"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full"
            >
              <Lock className="w-5 h-5" />
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Shiva Lal Agarwala &amp; Co. &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
