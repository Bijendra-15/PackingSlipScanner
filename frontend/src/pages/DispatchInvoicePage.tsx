import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Home } from 'lucide-react'

interface ScanOrderNoResponse {
  Status: string | number
  Data?: unknown
}

export function DispatchInvoice() {
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScanningRef = useRef(false)

  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [orderNo, setOrderNo] = useState('')

  // Mirror the original `finyear = JSON.parse(dencrypted(sessionStorage.getItem("FinYear"))).FinYear`
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

  const ClearAllMSgs = useCallback(() => {
    setStatusMsg('')
  }, [])

  const ScanOrderNo = useCallback(() => {
    if (isScanningRef.current) return

    let pScanOrderNo = orderNo
    if (pScanOrderNo.indexOf('#') > -1) {
      pScanOrderNo = pScanOrderNo.slice(0, -1)
    }
    pScanOrderNo = pScanOrderNo.trim()
    if (!pScanOrderNo) {
      return
    }

    isScanningRef.current = true
    ClearAllMSgs()
    setOrderNo('')

    const data = {
      OrderNo: pScanOrderNo,
      FinYear: finyear,
    }

    apiClient
      .post<ScanOrderNoResponse>('/ScanOrderNo', JSON.stringify(data))
      .then((response) => {
        const status = parseInt(String(response.Status ?? 0))

        if (status === 1) {
          sessionStorage.setItem('ScanOrderNo', JSON.stringify(response.Data))
          setStatusColor('text-green-600')
          navigate('/dispatch-scan-carton')
        } else if (status === -1) {
          setStatusMsg('Order No Closed.')
          setStatusColor('text-red-600')
        } else {
          setStatusMsg('Invalid Order No.')
          setStatusColor('text-red-600')
        }
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        isScanningRef.current = false
        inputRef.current?.focus()
      })
  }, [orderNo, finyear, navigate, ClearAllMSgs])

  useEffect(() => {
    // pagecreate equivalent: 500ms polling interval
    intervalRef.current = setInterval(() => {
      if (orderNo.trim().length > 0) {
        ScanOrderNo()
      } else {
        inputRef.current?.focus()
      }
    }, 500)

    // pagebeforeshow equivalent: focus after 500ms
    timerRef.current = setTimeout(() => {
      inputRef.current?.select()
      inputRef.current?.focus()
    }, 500)

    return () => {
      // pageremove equivalent: clear timers
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [ScanOrderNo, orderNo])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                Dispatch Invoice
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
          <center>
            <form method="post" autoComplete="off" noValidate>
              <label htmlFor="txtScanOrderNo" className="block text-sm font-medium text-slate-700 mb-2">
                Scan/Input Order No
              </label>
              <input
                type="text"
                name="txtScanOrderNo"
                id="txtScanOrderNo"
                ref={inputRef}
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                autoFocus
                className="w-full max-w-md px-3 py-3 text-xl text-center border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />
              <p
                id="apistatusmsg"
                className={`mt-4 text-lg font-bold text-center ${statusColor}`}
              >
                {statusMsg}
              </p>
              <div className="mt-8 flex justify-center">
                {isScanningRef.current && (
                  <span className="text-sm text-slate-500">Scanning...</span>
                )}
              </div>
            </form>
          </center>
        </div>
      </main>
    </div>
  )
}