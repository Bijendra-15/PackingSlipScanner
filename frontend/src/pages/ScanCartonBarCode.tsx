import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useToast, toastMessage } from '@/components/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, Home, Power } from 'lucide-react'

interface ScanCartonData {
  ChallanNo: string | number
  FinYr: string
  FinYear?: string
  Total_Cartons?: number | string
  Total_Rcv_Cartons?: number | string
  Total_Bal_Cartons?: number | string
  Total_Sort_Cartons?: number | string
  Total_Exc_Cartons?: number | string
}

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function ScanCartonBarCode() {
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [dialogDecision, setDialogDecision] = useState('')
  const [lastScannedBarcode, setLastScannedBarcode] = useState('')

  const rawScanCarton = sessionStorage.getItem('ScanCartonBarCode')
  const urlFinYear = new URLSearchParams(window.location.search).get('finyear') ?? ''
  let scanCartonData: ScanCartonData | null = null
  try {
    const parsed = rawScanCarton ? JSON.parse(rawScanCarton) : null
    if (parsed) {
      scanCartonData = { ...parsed, FinYr: parsed.FinYr ?? parsed.FinYear ?? '' }
    } else if (urlFinYear) {
      scanCartonData = { ChallanNo: '', FinYr: urlFinYear }
    }
  } catch {
    scanCartonData = urlFinYear ? { ChallanNo: '', FinYr: urlFinYear } : null
  }

  const readScanCartonData = useCallback((): ScanCartonData | null => {
    const raw = sessionStorage.getItem('ScanCartonBarCode')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        return { ...parsed, FinYr: parsed.FinYr ?? parsed.FinYear ?? '' }
      } catch {
        // fall through to fallbacks
      }
    }
    const hdnFinyear = document.getElementById('hdnFinyear') as HTMLInputElement | null
    const hdnChallanNo = document.getElementById('hdnChallanNo') as HTMLInputElement | null
    const urlFinYear = new URLSearchParams(window.location.search).get('finyear') ?? ''
    const finYr = hdnFinyear?.value || urlFinYear
    const challanNo = hdnChallanNo?.value ?? ''
    if (challanNo || finYr) {
      return { ChallanNo: challanNo, FinYr: finYr }
    }
    return null
  }, [])

  const BindDtl = useCallback((Data: ScanCartonData) => {
    const challanEl = document.getElementById('RcvChallanNo')
    if (challanEl) {
      challanEl.textContent = `${Data.ChallanNo}/${Data.FinYr}`
    }
    const hdnFinyear = document.getElementById('hdnFinyear') as HTMLInputElement | null
    const hdnChallanNo = document.getElementById('hdnChallanNo') as HTMLInputElement | null
    if (hdnFinyear) hdnFinyear.value = String(Data.FinYr ?? '')
    if (hdnChallanNo) hdnChallanNo.value = String(Data.ChallanNo ?? '')
  }, [])

  const renderSummary = useCallback((Data: ScanCartonData) => {
    const table = document.querySelector('.tblScanCartonBarCode') as HTMLTableElement | null
    if (!table) return
    table.innerHTML = `
      <tr>
        <th>Total Cartons</th>
        <td>${Data.Total_Cartons ?? '-'}</td>
        <th>Received Cartons</th>
        <td>${Data.Total_Rcv_Cartons ?? '-'}</td>
      </tr>
      <tr>
        <th>Balance Cartons</th>
        <td>${Data.Total_Bal_Cartons ?? '-'}</td>
        <th>Short Cartons</th>
        <td>${Data.Total_Sort_Cartons ?? '-'}</td>
      </tr>
      <tr>
        <th>Excess Cartons</th>
        <td>${Data.Total_Exc_Cartons ?? '-'}</td>
        <th></th>
        <td></td>
      </tr>
    `
  }, [])

  const UpdateBindDtl = useCallback(async () => {
    const current = readScanCartonData()
    if (!current) return

    const data = {
      ChallanNo: current.ChallanNo,
      FinYear: current.FinYr,
    }

    setLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<ScanCartonData>>('/ScanChallanNo', data)
      if (parseInt(String(response.Status ?? 0)) === 1 && response.Data) {
        const normalizedData = { ...response.Data, FinYr: response.Data.FinYr ?? response.Data.FinYear ?? '' }
        sessionStorage.setItem('ScanCartonBarCode', JSON.stringify(normalizedData))
        BindDtl(normalizedData)
        renderSummary(normalizedData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [BindDtl, renderSummary, readScanCartonData])

  const ScanCarton = useCallback(() => {
    const input = inputRef.current
    if (!input || isScanningRef.current) return

    let pScanCarton = input.value
    if (pScanCarton.indexOf('#') > -1) {
      pScanCarton = pScanCarton.slice(0, -1)
    } else {
      pScanCarton = input.value
    }

    const current = readScanCartonData()
    const hdnScanCarton = document.getElementById('hdnScanCarton') as HTMLInputElement | null

    if (!current || !current.ChallanNo) {
      setStatusColor('text-red-600')
      setStatusMsg('Challan not found. Please scan challan no first.')
      input.value = ''
      input.focus()
      return
    }

    const data = {
      BarcodeNo: pScanCarton,
      UserNm: user?.UserName ?? '',
      FinYear: current.FinYr ?? '',
      ChallanNo: current.ChallanNo ?? '',
    }

    setLoading(true)
    isScanningRef.current = true

    void apiClient.post<ApiResponse<unknown>>('/ScanCarton', data).then((response) => {
      const status = parseInt(String(response.Status ?? 0))
      const msgEl = document.getElementById('ScanCartonMessage')
      if (msgEl) msgEl.textContent = String(response.Data ?? '')

      if (status === 1) {
        if (msgEl) msgEl.style.color = 'green'
        setStatusColor('text-green-600')
        input.value = ''
        setLastScannedBarcode(pScanCarton)
        setStatusMsg(String(response.Data ?? ''))
      } else if (status === -2) {
        setConfirmMsg(String(response.Data ?? ''))
        setDialogDecision('Excess')
        setConfirmOpen(true)
        input.value = ''
        setLastScannedBarcode(pScanCarton)
      } else {
        if (msgEl) msgEl.style.color = 'red'
        setStatusColor('text-red-600')
        input.value = ''
        setLastScannedBarcode(pScanCarton)
        setStatusMsg(String(response.Data ?? ''))
      }

      if (hdnScanCarton) hdnScanCarton.value = pScanCarton
      input.value = ''
      input.focus()
    }).catch((err) => {
      console.error(err)
      input.value = ''
      input.focus()
    }).finally(() => {
      setLoading(false)
      isScanningRef.current = false
      void UpdateBindDtl()
    })
  }, [user?.UserName, UpdateBindDtl, readScanCartonData])

  const func_CloseFinal = useCallback(() => {
    const current = readScanCartonData()

    const data = {
      ChallanNo: current?.ChallanNo ?? '',
      FinYear: current?.FinYr ?? '',
    }

    setLoading(true)
    void apiClient.post<ApiResponse<unknown>>('/ScanCartonCloseFinal', data).then((response) => {
      const status = parseInt(String(response.Status ?? 0))
      const msgEl = document.getElementById('ScanCartonMessage')
      if (msgEl) msgEl.textContent = String(response.Data ?? '')

      if (status === 1) {
        setStatusColor('text-green-600')
        toastMessage(toast, String(response.Data ?? ''), '1')
        navigate('/recv-dashboard')
      } else if (status === -1) {
        setConfirmMsg(
          `${response.Data ?? ''} <br/>are not scanned, if you close without scanning these cartons, these cartons will be marked as Missing Cartons, do you want to Proceed.`
        )
        setDialogDecision('CloseFinal')
        setConfirmOpen(true)
      } else {
        setStatusColor('text-red-600')
        toastMessage(toast, String(response.Data ?? ''), '1')
        navigate('/recv-dashboard')
      }
    }).catch((err) => {
      console.error(err)
    }).finally(() => {
      setLoading(false)
      void UpdateBindDtl()
    })
  }, [toast, navigate, UpdateBindDtl, readScanCartonData])

  const func_ConfirmYes = useCallback(() => {
    const current = readScanCartonData()

    if (dialogDecision === 'CloseFinal') {
      const data = {
        ChallanNo: current?.ChallanNo ?? '',
        FinYear: current?.FinYr ?? '',
      }

      setLoading(true)
      void apiClient.post<ApiResponse<unknown>>('/MissingScanCartons', data).then((response) => {
        const status = parseInt(String(response.Status ?? 0))
        const msgEl = document.getElementById('ScanCartonMessage')
        if (msgEl) msgEl.textContent = String(response.Data ?? '')

        if (status === 1) {
          setStatusColor('text-green-600')
          toastMessage(toast, String(response.Data ?? ''), '1')
          navigate('/recv-dashboard')
        } else {
          setStatusColor('text-red-600')
          setConfirmOpen(false)
          void UpdateBindDtl()
        }
      }).catch((err) => {
        console.error(err)
      }).finally(() => {
        setLoading(false)
      })
    } else {
      const data = {
        BarcodeNo: lastScannedBarcode,
        UserNm: user?.UserName ?? '',
        FinYear: current?.FinYr ?? '',
        ChallanNo: current?.ChallanNo ?? '',
      }

      setLoading(true)
      void apiClient.post<ApiResponse<unknown>>('/ExcessScanCartons', data).then((response) => {
        const status = parseInt(String(response.Status ?? 0))
        const msgEl = document.getElementById('ScanCartonMessage')
        if (msgEl) msgEl.textContent = String(response.Data ?? '')

        if (status === 1) {
          setStatusColor('text-green-600')
          inputRef.current && (inputRef.current.value = '')
          setLastScannedBarcode('')
        } else {
          setStatusColor('text-red-600')
          inputRef.current && (inputRef.current.value = '')
          setLastScannedBarcode('')
        }
        setConfirmOpen(false)
        void UpdateBindDtl()
      }).catch((err) => {
        console.error(err)
      }).finally(() => {
        setLoading(false)
      })
    }
  }, [dialogDecision, lastScannedBarcode, user?.UserName, toast, navigate, UpdateBindDtl, readScanCartonData])

  useEffect(() => {
    if (scanCartonData) {
      BindDtl(scanCartonData)
      renderSummary(scanCartonData)
    } else {
      navigate('/scan-challan-no')
    }

    intervalRef.current = setInterval(() => {
      if (isScanningRef.current) return
      const input = inputRef.current
      if (input && input.value.trim().length > 11) {
        ScanCarton()
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
  }, [scanCartonData, BindDtl, renderSummary, ScanCarton, navigate])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-brand-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Receive Challan</h1>
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
          <form autoComplete="off" noValidate>
            <h2 id="RcvChallanNo">Challan No :</h2>
            <input type="hidden" id="hdnFinyear" name="hdnFinyear" />
            <input type="hidden" id="hdnChallanNo" name="hdnChallanNo" />
            <input type="hidden" id="hdnScanCarton" name="hdnScanCarton" />
            <table className="tblScanCartonBarCode"></table>

            <label htmlFor="txtScanCarton">Scan Carton</label>
            <input
              type="text"
              name="txtScanCarton"
              id="txtScanCarton"
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
              to="/view-received-barcode"
              id="logDispatch"
              className="mt-4 inline-block text-sm text-brand-600 hover:underline"
            >
              View Received Barcodes
            </Link>
            <Link
              to="/recv-dashboard"
              id="go_ToRecvDashboard"
              className="hidden"
            >
            </Link>
          </form>
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
                onClick={func_CloseFinal}
                disabled={loading}
              >
                <span>Close Final</span>
              </button>
            </td>
          </tr>
        </table>

        {confirmOpen && (
          <div
            id="myPopupDialog"
            className="fixed inset-0 z-[60] flex items-center justify-center"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmOpen(false)}
            />
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full border border-slate-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                <h1 className="text-lg font-semibold text-slate-900">Confirmation</h1>
              </div>
              <p id="pConfirmMsg" className="text-slate-700 mb-6" dangerouslySetInnerHTML={{ __html: confirmMsg }} />
              <input type="hidden" id="hdnDialogDecision" name="hdnDialogDecision" />
              <table className="w-full">
                <tr>
                  <td style={{ width: '50%' }}>
                    <button
                      style={{ width: '100%', height: 50, borderRadius: 25 }}
                      className="bg-brand-600 text-white text-sm font-medium rounded-full flex items-center justify-center gap-2"
                      onClick={func_ConfirmYes}
                      disabled={loading}
                    >
                      <span>Yes</span>
                    </button>
                  </td>
                  <td style={{ width: '50%' }}>
                    <button
                      style={{ width: '100%', height: 50, borderRadius: 25 }}
                      className="bg-slate-200 text-slate-700 text-sm font-medium rounded-full flex items-center justify-center gap-2"
                      onClick={() => setConfirmOpen(false)}
                      id="CnfNoBtn"
                    >
                      <span>No</span>
                    </button>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
