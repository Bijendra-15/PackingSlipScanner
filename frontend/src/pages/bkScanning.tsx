import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Home, ArrowLeft, Power } from 'lucide-react'

interface BalanceItem {
  Book: string
  BalQty: string | number
}

interface ScanBrcdResponse {
  Status: string | number
  Data?: { Status: string | number; Msg: string; Book: string; BalQty: string | number }[]
}

interface BkOrderData {
  OrderNo: string
  FinYear: string
}

export function BkScanning() {
  const navigate = useNavigate()

  const barcodeRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [barcode, setBarcode] = useState('')
  const [qty, setQty] = useState('1')
  const [qtyDisabled, setQtyDisabled] = useState(true)
  const [bookName, setBookName] = useState('')
  const [showSaveBtn, setShowSaveBtn] = useState(false)
  const [message, setMessage] = useState('')
  const [messageColor, setMessageColor] = useState('green')
  const [balanceRows, setBalanceRows] = useState<BalanceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [barcodeBound, setBarcodeBound] = useState('')

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
  finyear = finyear.replace(/[^0-9]/g, '')

  const clearMessage = useCallback(() => {
    setMessage('')
  }, [])

  const validateQty = useCallback((value: string) => {
    const q = parseInt(value, 10)
    if (isNaN(q) || q <= 0) {
      setQty('1')
      return false
    }
    return true
  }, [])

  const ScanBrcd = useCallback(async () => {
    if (loading) return

    let pScanBrcd = barcode.trim()
    if (!pScanBrcd) return

    if (pScanBrcd.indexOf('#') > -1) {
      pScanBrcd = pScanBrcd.slice(0, -1)
    }

    const userRaw = sessionStorage.getItem('Login')
    let userName = ''
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw)
        userName = parsed?.UserName ?? ''
      } catch { }
    }

    const bkOrderRaw = sessionStorage.getItem('BkOrderDtl')
    if (!bkOrderRaw) return

    let bkOrderData: BkOrderData | null = null
    try {
      bkOrderData = JSON.parse(bkOrderRaw)
    } catch { }

    if (!bkOrderData) return

    setLoading(true)
    clearMessage()

    setBarcodeBound(pScanBrcd)

    const data = {
      BarcodeNo: pScanBrcd,
      UserNm: userName,
      FinYear: bkOrderData.FinYear,
      OrderNo: bkOrderData.OrderNo,
      Qty: 0,
      BarcodeType: '',
    }

    try {
      const response = await apiClient.post<ScanBrcdResponse>('/ScanBrcd', data)
      const status = parseInt(String(response.Status ?? 0))
      const dataStatus = response.Data && response.Data[0] ? parseInt(String(response.Data[0].Status ?? 0)) : 0

      if (status === 1 && dataStatus === 1) {
        const items = response.Data ?? []
        const rows: BalanceItem[] = items.map(item => ({
          Book: item.Book,
          BalQty: item.BalQty,
        }))
        setBalanceRows(rows)
        setMessage(response.Data?.[0]?.Msg ?? 'Success')
        setMessageColor('green')
        setShowSaveBtn(false)
        setQtyDisabled(true)
        setQty('1')
        setBookName('')
        setBarcode('')
        barcodeRef.current?.focus()
      } else if (status === 404 && dataStatus === 404) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setShowSaveBtn(true)
        setQtyDisabled(false)
        setBookName(response.Data?.[0]?.Book ?? '')
        setMessage('')
        qtyRef.current?.focus()
      } else {
        setMessage(response.Data?.[0]?.Msg ?? 'Error')
        setMessageColor('red')
        setBarcode('')
        barcodeRef.current?.focus()
        setShowSaveBtn(false)
        setQtyDisabled(true)
        setQty('1')
        setBookName('')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error scanning barcode.')
      setMessageColor('red')
      setBarcode('')
      barcodeRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }, [barcode, loading, clearMessage])

  const handleSave = useCallback(async () => {
    if (loading) return

    if (!validateQty(qty)) return

    const pScanBrcd = barcodeBound
    if (!pScanBrcd) return

    const userRaw = sessionStorage.getItem('Login')
    let userName = ''
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw)
        userName = parsed?.UserName ?? ''
      } catch { }
    }

    const bkOrderRaw = sessionStorage.getItem('BkOrderDtl')
    if (!bkOrderRaw) return

    let bkOrderData: BkOrderData | null = null
    try {
      bkOrderData = JSON.parse(bkOrderRaw)
    } catch { }

    if (!bkOrderData) return

    setLoading(true)
    clearMessage()

    const data = {
      BarcodeNo: pScanBrcd,
      UserNm: userName,
      FinYear: bkOrderData.FinYear,
      OrderNo: bkOrderData.OrderNo,
      Qty: parseInt(qty, 10),
      BarcodeType: 'ISBN',
    }

    try {
      const response = await apiClient.post<ScanBrcdResponse>('/ScanBrcd', data)
      const status = parseInt(String(response.Status ?? 0))
      const dataStatus = response.Data && response.Data[0] ? parseInt(String(response.Data[0].Status ?? 0)) : 0

      if (status === 1 && dataStatus === 1) {
        const items = response.Data ?? []
        const rows: BalanceItem[] = items.map(item => ({
          Book: item.Book,
          BalQty: item.BalQty,
        }))
        setBalanceRows(rows)
        setMessage(response.Data?.[0]?.Msg ?? 'Saved')
        setMessageColor('green')
        setShowSaveBtn(false)
        setQtyDisabled(true)
        setQty('1')
        setBookName('')
        setBarcode('')
        barcodeRef.current?.focus()

        if (intervalRef.current === null) {
          intervalRef.current = setInterval(() => {
            if (loading) return
            const input = barcodeRef.current
            if (input && input.value.trim().length > 12) {
              ScanBrcd()
            } else {
              input?.focus()
            }
          }, 1500)
        }
      } else {
        setMessage(response.Data?.[0]?.Msg ?? 'Error')
        setMessageColor('red')
        setBarcode('')
        barcodeRef.current?.focus()
        setShowSaveBtn(false)
        setQtyDisabled(true)
        setQty('1')
        setBookName('')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error saving.')
      setMessageColor('red')
      setBarcode('')
      barcodeRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }, [barcodeBound, qty, loading, clearMessage, validateQty, ScanBrcd])

  const handleQtyBlur = useCallback(() => {
    validateQty(qty)
  }, [qty, validateQty])

  const goBack = useCallback(() => {
    navigate('/bk-order')
  }, [navigate])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (loading) return
      const input = barcodeRef.current
      if (input && input.value.trim().length > 12) {
        ScanBrcd()
      } else {
        input?.focus()
      }
    }, 1500)

    timerRef.current = setTimeout(() => {
      barcodeRef.current?.select()
      barcodeRef.current?.focus()
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
    }
  }, [ScanBrcd, loading])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-brand-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Barcode Scanning</h1>
              </div>
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
          <center>
            <form method="post" action="/" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <input
                type="hidden"
                id="hdnBndBrcd"
                value={barcodeBound}
              />
              <label htmlFor="txtScnBrcd" className="block text-sm font-medium text-slate-700 mb-2">
                Scan Barcode
              </label>
              <input
                id="txtScnBrcd"
                ref={barcodeRef}
                type="text"
                name="txtScnBrcd"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
                className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />

              <label htmlFor="txtScnQty" className="block text-sm font-medium text-slate-700 mb-2 mt-4">
                Scanned Quantity
              </label>
              <input
                id="txtScnQty"
                ref={qtyRef}
                type="text"
                name="txtScnQty"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onBlur={handleQtyBlur}
                disabled={qtyDisabled}
                className={`w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors ${
                  qtyDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                }`}
              />

              {bookName && (
                <label id="lblBook" className="block text-sm font-medium text-brand-600 mt-2">
                  {bookName}
                </label>
              )}

              {showSaveBtn && (
                <button
                  id="btnSave"
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full mt-4 h-[50px] rounded-[25px] bg-brand-600 text-white text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: 25 }}
                >
                  Save
                </button>
              )}

              {message && (
                <p id="bkScnMessage" className={`mt-4 text-lg font-bold text-center ${messageColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </form>
          </center>

          <p className="mt-6 mb-4 text-center text-sm font-medium text-slate-700">Balance To Scan</p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-slate-200 rounded-lg">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Book</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Balance Quantity</th>
                </tr>
              </thead>
              <tbody id="bkScnTblBdy">
                {balanceRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400">No balance data</td>
                  </tr>
                ) : (
                  balanceRows.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{item.Book}</td>
                      <td className="px-4 py-2 text-slate-700 text-right">{item.BalQty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            <button
              onClick={goBack}
              className="w-full max-w-md h-[50px] rounded-[25px] bg-slate-600 text-white text-base font-medium transition-colors"
              style={{ borderRadius: 25 }}
            >
              <ArrowLeft className="w-5 h-5 inline mr-2" />
              Back
            </button>
            <Link to="/bk-order" id="to_bkfinyear" className="hidden" />
          </div>
        </div>
      </main>
    </div>
  )
}