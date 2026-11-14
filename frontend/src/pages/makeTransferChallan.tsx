import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Home } from 'lucide-react'

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function makeTransferChallan() {
  const navigate = useNavigate()

  const scanInputRef = useRef<HTMLInputElement>(null)
  const vehicleInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scanValue, setScanValue] = useState('')
  const [vehicleValue, setVehicleValue] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [loading, setLoading] = useState(false)

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

  const ScanTrChlnNo = useCallback(async (challanNo: string, vehicleNo: string) => {
    ClearAllMSgs()
    let pScanTrChlnNo = challanNo
    if (pScanTrChlnNo.indexOf('#') > -1) {
      pScanTrChlnNo = pScanTrChlnNo.slice(0, -1)
    }
    const data = {
      ChallanNo: parseInt(pScanTrChlnNo, 10) || 0,
      FinYear: finyear,
      VehicleNo: vehicleNo,
    }

    setLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<unknown>>('/ScanTrChallanNo/', data)
      const status = parseInt(String(response.Status ?? 0))
      if (status === 1) {
        sessionStorage.setItem('ScanTrChallanNo', JSON.stringify(response.Data))
        setStatusColor('text-green-600')
        navigate('/tr-challan-scan-carton')
      } else if (status === -2) {
        setStatusMsg('Different Vehicle No Found.')
        setStatusColor('text-red-600')
      } else if (status === -1) {
        setStatusMsg('Transfer Challan No Closed.')
        setStatusColor('text-red-600')
      } else {
        setStatusMsg('Invalid Transfer Challan No.')
        setStatusColor('text-red-600')
      }
    } catch (err) {
      console.error(err)
      setStatusColor('text-red-600')
    } finally {
      setLoading(false)
    }
  }, [finyear, navigate, ClearAllMSgs])

  const func_ValidateTrChlnNo = useCallback(() => {
    if (scanValue.trim().length > 0 && vehicleValue.trim().length > 0) {
      sessionStorage.setItem('VehicleNo', vehicleValue.trim())
      void ScanTrChlnNo(scanValue, vehicleValue)
      setScanValue('')
      setVehicleValue('')
    } else if (scanValue.trim().length > 0) {
      vehicleInputRef.current?.focus()
    } else {
      scanInputRef.current?.focus()
    }
  }, [scanValue, vehicleValue, ScanTrChlnNo])

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      scanInputRef.current?.select()
      scanInputRef.current?.focus()
    }, 500)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                Transfer Challan
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
          <form
            method="post"
            action="/"
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            <center>
              <label
                htmlFor="txtScanTrChlnNo"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Scan Transfer Challan No
              </label>
              <input
                type="text"
                name="txtScanTrChlnNo"
                id="txtScanTrChlnNo"
                ref={scanInputRef}
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                autoFocus
                className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />

              <label
                htmlFor="txtVehicleNo"
                className="block text-sm font-medium text-slate-700 mb-2 mt-4"
              >
                Scan Vehicle No
              </label>
              <input
                type="text"
                name="txtVehicleNo"
                id="txtVehicleNo"
                ref={vehicleInputRef}
                value={vehicleValue}
                onChange={(e) => setVehicleValue(e.target.value)}
                className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />

              <div className="mt-6">
                <button
                  type="button"
                  onClick={func_ValidateTrChlnNo}
                  disabled={loading}
                  className="bg-brand-600 text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ height: 50, borderRadius: 25, paddingLeft: 32, paddingRight: 32 }}
                >
                  <span>Start Scanning</span>
                </button>
              </div>

              <p
                id="apistatusmsg"
                className={`mt-4 text-lg font-bold text-center ${statusColor}`}
              >
                {statusMsg}
              </p>

              <Link
                to="/tr-challan-scan-carton"
                id="to_TrChlnNoScanCarton"
                className="hidden"
              >
              </Link>
            </center>
          </form>
        </div>
      </main>
    </div>
  )
}