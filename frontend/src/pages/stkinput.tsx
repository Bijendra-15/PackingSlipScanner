import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { Home } from 'lucide-react'

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function stkinput() {
  const { user } = useAuth()

  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScanningRef = useRef(false)

  const [result, setResult] = useState('')
  const [resultBg, setResultBg] = useState('transparent')

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
  // Ensure finyear only contains numeric characters (in case stored proc expects numeric)
  finyear = finyear.replace(/[^0-9]/g, '')

  const StkInput = useCallback(() => {
    const input = inputRef.current
    if (!input || isScanningRef.current) return

    let pScanCarton = input.value
    if (pScanCarton.indexOf('#') > -1) {
      pScanCarton = pScanCarton.slice(0, -1)
    }
    pScanCarton = pScanCarton.replace(/[^0-9]/g, '')

    if (!pScanCarton) {
      setResult('Invalid barcode: no numeric characters found')
      setResultBg('red')
      input.value = ''
      input.focus()
      return
    }

    const data = {
      BarcodeNo: pScanCarton,
      UserNm: user?.UserName ?? '',
      FinYear: finyear,
    }

    console.log('StkInput sending:', data)

    isScanningRef.current = true

    void apiClient.post<ApiResponse<unknown>>('/StkInput', data).then((response) => {
      const status = parseInt(String(response.Status ?? 0))
      setResult(String(response.Data ?? ''))
      if (status === 1) {
        setResultBg('green')
      } else {
        setResultBg('red')
      }
      input.value = ''
      input.focus()
    }).catch((err) => {
      console.error(err)
      input.value = ''
      input.focus()
    }).finally(() => {
      isScanningRef.current = false
    })
  }, [user?.UserName, finyear])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isScanningRef.current) return
      const input = inputRef.current
      if (input && input.value.trim().length > 11) {
        StkInput()
      } else {
        input?.focus()
      }
    }, 500)

    timerRef.current = setTimeout(() => {
      inputRef.current?.select()
      inputRef.current?.focus()
    }, 1500)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [StkInput])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                Stock Input
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
          <form method="post" action="/" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <center>
              <label htmlFor="txtStkInput" className="block text-sm font-medium text-slate-700 mb-2">
                Scan Barcode
              </label>
              <input
                type="text"
                name="txtStkInput"
                id="txtStkInput"
                ref={inputRef}
                readOnly={false}
                autoFocus
                className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />
              <div
                id="dvResult"
                style={{
                  height: 207,
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: resultBg,
                }}
              >
                {result}
              </div>
            </center>
          </form>
        </div>
      </main>
    </div>
  )
}