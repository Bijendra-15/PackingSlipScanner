import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useToast, toastMessage } from '@/components/Toast'
import { Home, Barcode, AlertTriangle } from 'lucide-react'

interface OpenChallan {
  Value: string
  Text: string
}

interface ChallanSummary {
  Total_Cartons?: number | string
  Total_Rcv_Cartons?: number | string
  Total_Bal_Cartons?: number | string
  Total_Sort_Cartons?: number | string
  Total_Exc_Cartons?: number | string
}

interface RcvBarcode {
  Barcode?: string
  Recvstatus?: string
  Notebookcode?: string
  Notebookqty?: number | string
}

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function ViewReceivedBarcode() {
  const [openChallans, setOpenChallans] = useState<OpenChallan[]>([])
  const [selectedChallan, setSelectedChallan] = useState<string>('')
  const [summary, setSummary] = useState<ChallanSummary>({})
  const [barcodes, setBarcodes] = useState<RcvBarcode[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [statusColor, setStatusColor] = useState('text-green-600')
  const [loading, setLoading] = useState(false)
const [confirmOpen, setConfirmOpen] = useState(false)
const [confirmMsg, setConfirmMsg] = useState('')
const toast = useToast()

  const finyearFromUrl = new URLSearchParams(window.location.search).get('finyear')

  const rawScanCarton = sessionStorage.getItem('ScanCartonBarCode')
  const scanCartonData = useMemo(() => {
    if (!rawScanCarton) return null
    try {
      const parsed = JSON.parse(rawScanCarton)
      return { ChallanNo: parsed.ChallanNo, FinYr: parsed.FinYr ?? parsed.FinYear ?? '' }
    } catch {
      return null
    }
  }, [rawScanCarton])

  const parseChallan = (val: string) => {
    const parts = val.split('/')
    return { ChallanNo: parseInt(parts[0], 10) || 0, FinYear: parts[1] ?? '' }
  }

  const p_BindRcvBarcodesInTbl = useCallback(
    async (val: string) => {
      const { ChallanNo, FinYear } = parseChallan(val)
      setLoading(true)
      try {
        const response = await apiClient.post<ApiResponse<RcvBarcode[]>>(
          '/GetAllByChallanNoFinYr',
          { ChallanNo, FinYear }
        )
        if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
          setBarcodes(response.Data)
        } else {
          setBarcodes([])
        }
      } catch (err) {
        console.error(err)
        setBarcodes([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const func_GetByChallanFinYr = useCallback(
    async (val: string) => {
      const { ChallanNo, FinYear } = parseChallan(val)
      setLoading(true)
      try {
        const response = await apiClient.post<ApiResponse<ChallanSummary>>(
          '/GetByChallanNoFinYr',
          { ChallanNo, FinYear }
        )
        if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
          setSummary(response.Data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
      await p_BindRcvBarcodesInTbl(val)
    },
    [p_BindRcvBarcodesInTbl]
  )

  const p_BindOpenChallans = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<ApiResponse<OpenChallan[]>>(
        '/GetAllOpenChallans'
      )
      const data = response.Data ?? []
      setOpenChallans(data)

      if (scanCartonData && data.length > 0) {
        const match = data.find(
          (c) => c.Value === `${scanCartonData.ChallanNo}/${scanCartonData.FinYr}`
        )
        if (match) {
          setSelectedChallan(match.Value)
          await func_GetByChallanFinYr(match.Value)
        } else if (data[0]) {
          setSelectedChallan(data[0].Value)
          await func_GetByChallanFinYr(data[0].Value)
          await ChallanNoDtl(data[0].Value.split('/')[0], data[0].Value.split('/')[1])
        }
      } else if (data.length > 0) {
        setSelectedChallan(data[0].Value)
        await func_GetByChallanFinYr(data[0].Value)
        await ChallanNoDtl(data[0].Value.split('/')[0], data[0].Value.split('/')[1])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [scanCartonData, func_GetByChallanFinYr])

  const ChallanNoDtl = useCallback(
    async (pScanChallanNo: string, pFinYear: string) => {
      try {
        const response = await apiClient.post<ApiResponse<unknown>>('/ScanChallanNo', {
          ChallanNo: parseInt(pScanChallanNo, 10) || 0,
          FinYear: pFinYear,
        })
        if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
          sessionStorage.setItem('ScanCartonBarCode', JSON.stringify(response.Data))
        }
      } catch (err) {
        console.error(err)
      }
    },
    []
  )

  const func_CloseRecvFinal = useCallback(async () => {
    const stored = sessionStorage.getItem('ScanCartonBarCode')
    if (!stored) return
    let Data: { ChallanNo?: string; FinYr?: string }
    try {
      Data = JSON.parse(stored)
    } catch {
      return
    }
    const data = { ChallanNo: Data.ChallanNo, FinYear: Data.FinYr }
    setLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<unknown>>(
        '/ScanCartonCloseFinal',
        data
      )
      const status = parseInt(String(response.Status ?? 0))
      if (status === 1) {
        setStatusMsg(String(response.Data ?? 'Closed successfully.'))
        setStatusColor('text-green-600')
        toastMessage(toast, String(response.Data ?? ''), '1')
        sessionStorage.removeItem('ScanCartonBarCode')
        await p_BindOpenChallans()
      } else if (status === -1) {
        setConfirmMsg(
          `${response.Data ?? ''} are not scanned, if you close without scanning these cartons, these cartons will be marked as Missing Cartons. Do you want to proceed?`
        )
        setConfirmOpen(true)
      } else {
        setStatusMsg(String(response.Data ?? ''))
        setStatusColor('text-red-600')
        toastMessage(toast, String(response.Data ?? ''), '1')
        sessionStorage.removeItem('ScanCartonBarCode')
        await p_BindOpenChallans()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [p_BindOpenChallans, toast])

  const func_ConfirmRecvYes = useCallback(async () => {
    const val = selectedChallan
    if (!val) return
    const { ChallanNo, FinYear } = parseChallan(val)
    setLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<unknown>>(
        '/MissingScanCartons',
        { ChallanNo, FinYear }
      )
      if (parseInt(String(response.Status ?? 0)) === 1) {
        setStatusMsg(String(response.Data ?? ''))
        setStatusColor('text-green-600')
        toastMessage(toast, String(response.Data ?? ''), '1')
        sessionStorage.removeItem('ScanCartonBarCode')
        setConfirmOpen(false)
        await p_BindOpenChallans()
      } else {
        setStatusMsg(String(response.Data ?? ''))
        setStatusColor('text-red-600')
        setConfirmOpen(false)
      }
    } catch (err) {
      console.error(err)
      setConfirmOpen(false)
    } finally {
      setLoading(false)
    }
  }, [selectedChallan, parseChallan, toast, p_BindOpenChallans])

  useEffect(() => {
    p_BindOpenChallans()

    if (selectedChallan) {
      void func_GetByChallanFinYr(selectedChallan)
    }
  }, [selectedChallan, p_BindOpenChallans, func_GetByChallanFinYr])

  const handleChallanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChallan(e.target.value)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                View Received Barcodes
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
          <div className="mb-6">
            <label
              htmlFor="SctOpnChln"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Open Challans:
            </label>
            <select
              id="SctOpnChln"
              name="SctOpnChln"
              value={selectedChallan}
              onChange={handleChallanChange}
              disabled={loading || openChallans.length === 0}
              className={`w-full max-w-md px-3 py-2.5 border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-400 ${loading || openChallans.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Select Challan --</option>
              {openChallans.map((c) => (
                <option key={c.Value} value={c.Value}>
                  {c.Text}
                </option>
              ))}
            </select>
          </div>

          {openChallans.length > 0 && selectedChallan && (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      Total Cartons
                    </th>
                    <td className="px-4 py-2">{summary.Total_Cartons ?? '-'}</td>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      Received Cartons
                    </th>
                    <td className="px-4 py-2">{summary.Total_Rcv_Cartons ?? '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      Balance Cartons
                    </th>
                    <td className="px-4 py-2">{summary.Total_Bal_Cartons ?? '-'}</td>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      Short Cartons
                    </th>
                    <td className="px-4 py-2">{summary.Total_Sort_Cartons ?? '-'}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      Excess Cartons
                    </th>
                    <td className="px-4 py-2">{summary.Total_Exc_Cartons ?? '-'}</td>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium">
                      &nbsp;
                    </th>
                    <td className="px-4 py-2">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="mb-6">
            <div className="tblGrid overflow-x-auto">
              <table
                id="tblReceivedBarcode"
                className="w-full text-left border-collapse border border-slate-200 rounded-lg"
              >
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      Barcode
                    </th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      Status
                    </th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      Note Book
                    </th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {barcodes.map((b, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${
                        b.Recvstatus === 'Excess' ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-2 text-slate-700">
                        {b.Barcode ?? ''}
                      </td>
                      <td className="px-4 py-2">
                        {b.Recvstatus === 'Excess' ? (
                          <span className="text-red-600 font-medium">Excess</span>
                        ) : (
                          <span className="text-slate-400">&nbsp;</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {b.Notebookcode ?? ''}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {b.Notebookqty ?? ''}
                      </td>
                    </tr>
                  ))}
                  {barcodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                        No barcodes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Link
              to={`/scan-carton-barcode?finyear=${encodeURIComponent(finyearFromUrl || '')}`}
              className="flex-1"
            >
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                <Barcode className="w-4 h-4" />
                Scan More
              </button>
            </Link>
            <button
              type="button"
              onClick={func_CloseRecvFinal}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Close Final
            </button>
          </div>

          {statusMsg && (
            <p
              id="ScanCartonMessage"
              className={`mt-4 text-lg font-bold text-center ${statusColor}`}
            >
              {statusMsg}
            </p>
          )}

          {confirmOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setConfirmOpen(false)}
              />
              <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full border border-slate-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                  <h3 className="text-lg font-semibold text-slate-900">Confirmation</h3>
                </div>
                <p className="text-slate-700 mb-6">{confirmMsg}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={func_ConfirmRecvYes}
                    disabled={loading}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
