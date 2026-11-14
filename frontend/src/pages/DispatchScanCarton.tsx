import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useToast, toastMessage } from '@/components/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Power } from 'lucide-react'

interface ScanOrderData {
  Orderid: string | number
  Orderfinyear: string
  FinYear?: string
  Total_Cartons?: number | string
  Total_Rcv_Cartons?: number | string
  Total_Bal_Cartons?: number | string
}

interface DispBarcode {
  Barcode?: string
  Notebookcode?: string
  NotebookCode?: string
  Qty?: number | string
}

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function DispatchScanCarton() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScanningRef = useRef(false)

  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState<DispBarcode[]>([])

  const rawScanOrder = sessionStorage.getItem('ScanOrderNo')
  const scanOrderData = useMemo<ScanOrderData | null>(() => {
    try {
      const parsed = rawScanOrder ? JSON.parse(rawScanOrder) : null
      return parsed
        ? { ...parsed, Orderfinyear: parsed.Orderfinyear ?? parsed.FinYear ?? '' }
        : null
    } catch {
      return null
    }
  }, [rawScanOrder])

  const readScanOrderData = useCallback((): ScanOrderData | null => {
    const raw = sessionStorage.getItem('ScanOrderNo')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return { ...parsed, Orderfinyear: parsed.Orderfinyear ?? parsed.FinYear ?? '' }
    } catch {
      return null
    }
  }, [])

  const p_BindOrdDataInTbl = useCallback(async () => {
    const Data = readScanOrderData()
    if (!Data) return

    const data = {
      OrderNo: Data.Orderid,
      FinYear: Data.Orderfinyear,
    }

    try {
      const response = await apiClient.post<ApiResponse<DispBarcode[]>>('/SpGetAllDispDtlByFinYearOrdId', data)
      if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
        setBarcodes(response.Data)
      } else {
        setBarcodes([])
      }
    } catch (err) {
      console.error(err)
      setBarcodes([])
    }
  }, [readScanOrderData])

  const BindOrdDtl = useCallback((Data: ScanOrderData) => {
    const orderEl = document.getElementById('h3OrderNo')
    if (orderEl) {
      orderEl.textContent = `Order No :${Data.Orderid}/${Data.Orderfinyear}`
    }
    const table = document.querySelector('.tblVwScanedCarton') as HTMLTableElement | null
    if (table) {
      table.innerHTML = `
        <tr>
          <th>Carton Scaned</th>
          <td>${Data.Total_Rcv_Cartons || 0}</td>
          <th>Carton Billed</th>
          <td>${Data.Total_Cartons || 0}</td>
        </tr>
        <tr>
          <th>Carton Balance</th>
          <td>${Data.Total_Bal_Cartons || 0}</td>
          <th></th>
          <td></td>
        </tr>
      `
    }
    void p_BindOrdDataInTbl()
  }, [p_BindOrdDataInTbl])

  const UpdateOrdBindDtl = useCallback(async (pOrderId: string | number, pFinYear: string) => {
    const data = {
      OrderNo: pOrderId,
      FinYear: pFinYear,
    }

    setLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<ScanOrderData>>('/ScanOrderNo', data)
      if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
        const normalized = { ...response.Data, Orderfinyear: response.Data.Orderfinyear ?? response.Data.FinYear ?? '' }
        sessionStorage.setItem('ScanOrderNo', JSON.stringify(normalized))
        BindOrdDtl(normalized)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [BindOrdDtl])

  const ScanOrdCarton = useCallback(() => {
    const input = inputRef.current
    if (!input || isScanningRef.current) return

    let pScanCarton = input.value
    if (pScanCarton.indexOf('#') > -1) {
      pScanCarton = pScanCarton.slice(0, -1)
    } else {
      pScanCarton = input.value
    }

    const Data = readScanOrderData()
    if (!Data) {
      setStatusColor('text-red-600')
      setStatusMsg('Order not found. Please scan order no first.')
      input.value = ''
      input.focus()
      return
    }

    const data = {
      BarcodeNo: pScanCarton,
      UserNm: user?.UserName ?? '',
      OrderNo: Data.Orderid,
      FinYear: Data.Orderfinyear,
    }

    setLoading(true)
    isScanningRef.current = true

    void apiClient.post<ApiResponse<unknown>>('/ScanDispatchCarton', data).then((response) => {
      const status = parseInt(String(response.Status ?? 0))
      const msgEl = document.getElementById('ScanCartonMessage')
      if (msgEl) msgEl.textContent = String(response.Data ?? '')

      if (status === 1) {
        setStatusColor('text-green-600')
        setStatusMsg(String(response.Data ?? ''))
      } else {
        setStatusColor('text-red-600')
        setStatusMsg(String(response.Data ?? ''))
      }
      input.value = ''
      input.focus()
    }).catch((err) => {
      console.error(err)
      input.value = ''
      input.focus()
    }).finally(() => {
      setLoading(false)
      isScanningRef.current = false
      void UpdateOrdBindDtl(Data.Orderid, Data.Orderfinyear)
    })
  }, [user?.UserName, readScanOrderData, UpdateOrdBindDtl])

  const func_CloseDispatch = useCallback(() => {
    const Data = readScanOrderData()
    if (!Data) return

    const data = {
      OrderNo: Data.Orderid,
      FinYear: Data.Orderfinyear,
    }

    setLoading(true)
    void apiClient.post<ApiResponse<unknown>>('/CloseDispatch', data).then((response) => {
      const msgEl = document.getElementById('ScanCartonMessage')
      if (msgEl) msgEl.textContent = String(response.Data ?? '')
      toastMessage(toast, String(response.Data ?? ''), '1')
      navigate('/recv-dashboard')
    }).catch((err) => {
      console.error(err)
    }).finally(() => {
      setLoading(false)
    })
  }, [readScanOrderData, toast, navigate])

  useEffect(() => {
    if (scanOrderData) {
      BindOrdDtl(scanOrderData)
    } else {
      navigate('/dispatchinvoice')
    }

    intervalRef.current = setInterval(() => {
      if (isScanningRef.current) return
      const input = inputRef.current
      if (input && input.value.trim().length > 11) {
        ScanOrdCarton()
      } else {
        input?.focus()
      }
    }, 1500)

    timerRef.current = setTimeout(() => {
      inputRef.current?.select()
      inputRef.current?.focus()
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
  }, [scanOrderData, BindOrdDtl, ScanOrdCarton, navigate])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-brand-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Details</h1>
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

      <div className="ui-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <center>
          <h3 id="h3OrderNo">Order No :</h3>
          <label htmlFor="txtOrdScanCarton">Scan Carton</label>
          <input
            type="text"
            name="txtOrdScanCarton"
            id="txtOrdScanCarton"
            ref={inputRef}
            readOnly={false}
            autoFocus
            className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
          />
          <p
            id="ScanCartonMessage"
            className={`mt-4 text-lg font-bold text-center ${statusColor}`}
          >
            {statusMsg}
          </p>
          <Link
            to="/recv-dashboard"
            id="go_ToRecvDashboard"
            className="hidden"
          >
          </Link>
          <table className="tblVwScanedCarton"></table>

          <div className="mt-6 overflow-x-auto">
            <table id="tblReceivedScanedCarton" className="w-full text-left border-collapse border border-slate-200 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Barcode</th>
                  <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Note Book</th>
                  <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Qty</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.map((b, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{b.Barcode ?? ''}</td>
                    <td className="px-4 py-2 text-slate-700">{b.Notebookcode ?? b.NotebookCode ?? ''}</td>
                    <td className="px-4 py-2 text-slate-700">{b.Qty ?? ''}</td>
                  </tr>
                ))}
                {barcodes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-400">No cartons scanned</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </center>

        <table className="mt-6 w-full">
          <tr>
            <td style={{ width: '50%' }}>
              <button
                style={{ width: '100%', height: 50, borderRadius: 25 }}
                className="bg-slate-600 text-white text-sm font-medium rounded-full flex items-center justify-center gap-2"
                onClick={() => navigate('/recv-dashboard')}
              >
                <span>Hold</span>
              </button>
            </td>
            <td style={{ width: '50%' }}>
              <button
                style={{ width: '100%', height: 50, borderRadius: 25 }}
                className="bg-brand-600 text-white text-sm font-medium rounded-full flex items-center justify-center gap-2"
                onClick={func_CloseDispatch}
                disabled={loading}
              >
                <span>Close Dispatch</span>
              </button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  )
}