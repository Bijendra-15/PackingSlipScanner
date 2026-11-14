import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, toastMessage } from '@/components/Toast'
import { apiClient } from '@/lib/apiClient'
import { CalendarDays, Power, BookOpen } from 'lucide-react'

interface FinYear {
  FinYearId?: number
  FinYearName?: string
  FinStDate?: Date | null
  FinEndDate?: Date | null
  FinYearCode?: string
  [key: string]: unknown
}

export function FinyearPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [years, setYears] = useState<FinYear[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const toast = useToast()
  const loadYearsRef = useRef(false)

  const isBookUser = user?.UserName?.toLowerCase() === 'book'
  const isRAppUser = user?.UserName?.toLowerCase() === 'rapp'

  const loadYears = useCallback(async () => {
    if (loadYearsRef.current) return
    loadYearsRef.current = true

    setLoading(true)
    try {
      const response = await apiClient.get<{ Data?: FinYear[] | null; Status?: string }>('/GetAllFinYear')
      const data = response.Data ?? []
      if (Array.isArray(data) && data.length > 0) {
        setYears(data)
        const initial = data[0].FinYearName ?? ''
        setSelectedYear(initial)
        if (initial) sessionStorage.setItem('FinYear', initial)
        toastMessage(toast, 'Financial years loaded successfully.', '1')
      } else {
        console.warn('GetAllFinYear returned empty data:', response)
        toastMessage(toast, 'No financial years available.', '-1')
      }
    } catch (err) {
      console.error('GetAllFinYear error:', err)
      toastMessage(toast, 'Failed to load financial years.', '-1')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadYears()
  }, [loadYears])

  const goToScan = () => {
    if (!selectedYear) {
      toastMessage(toast, 'Please select a financial year.', '-1')
      return
    }
    sessionStorage.setItem('FinYear', selectedYear)
    if (isBookUser) {
      navigate(`/bk-order?finyear=${encodeURIComponent(selectedYear)}`)
    } else {
      navigate(`/recv-dashboard?finyear=${encodeURIComponent(selectedYear)}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header (mirrors data-role="header") */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-brand-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fin Year</h1>
                <p className="text-xs text-slate-500">Shiva Lal Agarwala &amp; Co.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Select Financial Year</h2>
            <p className="text-sm text-slate-500">
              Choose the financial year to proceed with scanning.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="SctFinYear"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Fin Year
              </label>
              <select
                id="SctFinYear"
                name="SctFinYear"
                value={selectedYear}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedYear(value)
                  if (value) sessionStorage.setItem('FinYear', value)
                }}
                disabled={loading || years.length === 0}
                className={`w-full max-w-md px-3 py-2.5 border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-400 ${loading || years.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <option value="" disabled>
                  -- Select Financial Year --
                </option>
                {years.map((yr) => (
                  <option key={yr.FinYearName} value={yr.FinYearName ?? ''}>
                    {yr.FinYearName ?? yr.FinYearCode}
                  </option>
                ))}
              </select>
              {years.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  No financial years available.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {isBookUser && (
                <button
                  type="button"
                  onClick={goToScan}
                  disabled={!selectedYear || loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Scan Book
                </button>
              )}
              {isRAppUser && (
                <button
                  type="button"
                  onClick={goToScan}
                  disabled={!selectedYear || loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  Scan Notebooks
                </button>
              )}
              {!isBookUser && !isRAppUser && (
                <button
                  type="button"
                  onClick={goToScan}
                  disabled={!selectedYear || loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  Scan Notebooks
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
