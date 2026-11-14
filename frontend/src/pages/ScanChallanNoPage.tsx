import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Home, Barcode } from 'lucide-react'

interface ScanChallanNoResponse {
  Status: string | number
  Data?: unknown
}

export function ScanChallanNo() {
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScanningRef = useRef(false)

  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [loading, setLoading] = useState(false)
  const [readonly, setReadonly] = useState(true)

  const urlFinYear = new URLSearchParams(window.location.search).get('finyear') ?? ''
  const rawFinYear = sessionStorage.getItem('FinYear')
  let finyear = urlFinYear
  if (!finyear && rawFinYear) {
    try {
      const parsed = JSON.parse(rawFinYear)
      finyear = parsed?.FinYear ?? parsed?.FinYearName ?? rawFinYear
    } catch {
      finyear = rawFinYear
    }
  }
  finyear = String(finyear ?? '').trim()

  const clearMsgs = useCallback(() => {
    setStatusMsg('')
  }, [])

  const scanChallanNo = useCallback(async () => {
    const input = inputRef.current
    if (!input || isScanningRef.current) return

    let pScanChallanNo = input.value
    if (pScanChallanNo.indexOf('#') > -1) {
      pScanChallanNo = pScanChallanNo.slice(0, -1)
    }
    pScanChallanNo = pScanChallanNo.trim()
    if (!pScanChallanNo || pScanChallanNo.length === 0) {
      return
    }

    isScanningRef.current = true
    clearMsgs()
    input.value = ''
    setReadonly(true)

    const data = {
      ChallanNo: parseInt(pScanChallanNo, 10) || 0,
      FinYear: finyear,
    }

    setLoading(true)
    try {
      const response = await apiClient.post<ScanChallanNoResponse>('/ScanChallanNo', data)
      const status = parseInt(String(response.Status ?? 0))

      if (status === 1) {
        sessionStorage.setItem('ScanCartonBarCode', JSON.stringify(response.Data))
        setStatusMsg('Challan validated successfully.')
        setStatusColor('text-green-600')
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        navigate(`/scan-carton-barcode?finyear=${encodeURIComponent(finyear)}`)
        return
      } else if (status === -20001) {
        setStatusMsg(String(response.Data ?? ''))
        setStatusColor('text-red-600')
      } else {
        setStatusMsg(`Invalid Challan No. ${response.Status}`)
        setStatusColor('text-red-600')
      }
    } catch (err) {
      console.error(err)
      setStatusMsg('Error validating challan.')
      setStatusColor('text-red-600')
    } finally {
      setLoading(false)
      setReadonly(false)
      isScanningRef.current = false
      input.focus()
    }
  }, [finyear, navigate, clearMsgs])

  useEffect(() => {
    // pagebeforeshow equivalent: enable input + focus after short delay
    timerRef.current = setTimeout(() => {
      setReadonly(false)
      inputRef.current?.select()
      inputRef.current?.focus()
    }, 500)

    // pagecreate equivalent: interval polling (like original 500ms timer)
    intervalRef.current = setInterval(() => {
      if (isScanningRef.current) return
      if (inputRef.current && inputRef.current.value.trim().length > 4) {
        scanChallanNo()
      } else {
        inputRef.current?.focus()
      }
    }, 500)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setReadonly(true)
    }
  }, [scanChallanNo])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                Receive Challan
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
          <div className="text-center">
            <Barcode className="w-10 h-10 text-brand-600 mb-3 mx-auto" />
            <label
              htmlFor="txtScanChallanNo"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Scan Challan No
            </label>
            <input
              id="txtScanChallanNo"
              ref={inputRef}
              type="text"
              placeholder="Scan Challan No"
              readOnly={readonly}
              autoFocus
              className={`w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors ${
                readonly ? 'opacity-70 cursor-not-allowed disabled:bg-slate-100' : ''
              }`}
            />
            {statusMsg && (
              <p
                id="apistatusmsg"
                className={`mt-4 text-lg font-bold text-center ${statusColor}`}
              >
                {statusMsg}
              </p>
            )}
            <div className="mt-8 flex justify-center">
              {loading && (
                <span className="text-sm text-slate-500">Validating...</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
