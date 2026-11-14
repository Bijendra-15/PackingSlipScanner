import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { Home } from 'lucide-react'

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function profile() {
  const { user } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [disabled, setDisabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const getCurrentPassword = (): string => {
    const raw = sessionStorage.getItem('Login')
    if (!raw) return ''
    try {
      const parsed = JSON.parse(raw)
      return parsed?.Password ?? ''
    } catch {
      return ''
    }
  }

  const func_ConfPassValidation = useCallback((newPass: string, confirmPass: string) => {
    setStatusMsg('')
    const currentPassword = getCurrentPassword()
    if (newPass.length > 0 && newPass === confirmPass) {
      setDisabled(false)
    } else {
      setDisabled(true)
    }
    if (currentPassword && newPass === currentPassword) {
      setStatusMsg('This is your current password.')
      setStatusColor('text-red-600')
      setDisabled(true)
    } else {
      setStatusColor('text-green-600')
    }
  }, [])

  const func_ChangePassword = useCallback(async () => {
    if (!user?.UserId) {
      setStatusMsg('User not found.')
      setStatusColor('text-red-600')
      return
    }

    setLoading(true)
    try {
      const data = {
        UserId: user.UserId,
        Password: newPassword,
      }
      const response = await apiClient.post<ApiResponse<string>>('/ChangePassword', data)
      const status = String(response.Status ?? '')
      setStatusMsg(String(response.Data ?? ''))
      setStatusColor(status.includes('Success') ? 'text-green-600' : 'text-red-600')
      setNewPassword('')
      setConfirmPassword('')
      setDisabled(true)
    } catch (err) {
      console.error(err)
      setStatusColor('text-red-600')
    } finally {
      setLoading(false)
    }
  }, [user?.UserId, newPassword])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                Change Password
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/recv-dashboard">
                <button
                  type="button"
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Home"
                >
                  <Home className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form method="post" action="/" id="loginform" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <h4 className="text-center font-bold text-slate-900 mb-6">Change Password</h4>
            <div className="ui-field-contain">
              <label htmlFor="txtNewPassword" className="block text-sm font-medium text-slate-700 mb-2">
                New Password :
              </label>
              <input
                type="text"
                name="txtNewPassword"
                id="txtNewPassword"
                value={newPassword}
                onChange={(e) => {
                  const value = e.target.value
                  setNewPassword(value)
                  func_ConfPassValidation(value, confirmPassword)
                }}
                className="w-full max-w-md px-3 py-3 text-xl border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />

              <label htmlFor="txtConfirmPassword" className="block text-sm font-medium text-slate-700 mb-2 mt-4">
                Confirm New Password :
              </label>
              <input
                type="text"
                name="txtConfirmPassword"
                id="txtConfirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value
                  setConfirmPassword(value)
                  func_ConfPassValidation(newPassword, value)
                }}
                className="w-full max-w-md px-3 py-3 text-xl border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />
            </div>
            <center>
              <button
                type="button"
                id="btnChangePass"
                onClick={() => void func_ChangePassword()}
                disabled={disabled || loading}
                style={{ width: 170, height: 50, borderRadius: 25 }}
                className="bg-brand-600 text-white text-base font-medium rounded-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Change Password</span>
              </button>
              <p
                id="apistatusmsg"
                className={`mt-4 text-lg font-bold text-center ${statusColor}`}
              >
                {statusMsg}
              </p>
            </center>
          </form>
        </div>
      </main>
    </div>
  )
}