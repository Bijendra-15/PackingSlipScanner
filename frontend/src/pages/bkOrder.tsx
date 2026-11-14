import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Power } from 'lucide-react'

interface OrderDetailItem {
  OrderId: string | number
  Yr: string
  OrderDate: string
  OrderDateStr: string
  Customer: string
  Title: string
  Qty: string | number
  Scnqty: string | number
  Balqty: string | number
  OrdYrTotQty: string | number
  OrdYrBkCnt: string | number
}

interface ErrorItem {
  _Error?: string
  Msg?: string
  Status?: string | number
}

interface ScanOrderResponse {
  Status: string | number
  Data?: OrderDetailItem[] | ErrorItem[]
}

interface ScanBrcdResponse {
  Status: string | number
  Data?: { Status: string | number; Msg: string }[]
}

interface BkOrderData {
  OrderNo: string
  FinYear: string
}

function isOrderDetailItem(item: OrderDetailItem | ErrorItem): item is OrderDetailItem {
  return 'OrderId' in item
}

export function BkOrder() {
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [orderNo, setOrderNo] = useState('')
  const [message, setMessage] = useState('')
  const [messageColor, setMessageColor] = useState('green')

  const [orderInfo, setOrderInfo] = useState({
    orderNo: '0',
    orderDate: '',
    customer: '',
    totalBooks: '0',
    totalQty: '0',
    scanned: '0',
  })

  const [tableRows, setTableRows] = useState<OrderDetailItem[]>([])
  const [showCloseBtn, setShowCloseBtn] = useState(false)
  const [scanNowDisabled, setScanNowDisabled] = useState(true)
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
  finyear = finyear.replace(/[^0-9]/g, '')

  const clearMessage = useCallback(() => {
    setMessage('')
  }, [])

  const ScanOrder = useCallback(async () => {
    if (loading) return

    const pOrderNo = orderNo.trim()
    if (!pOrderNo || pOrderNo.length <= 1) return

    setLoading(true)
    clearMessage()

    try {
      const response = await apiClient.get<ScanOrderResponse>(
        `/GetOrdDtlByOrdNoFinYr/${encodeURIComponent(pOrderNo)}/${encodeURIComponent(finyear)}`
      )

      const status = parseInt(String(response.Status ?? 0))

      if (status === 1 && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
        const data = response.Data.filter(isOrderDetailItem) as OrderDetailItem[]

        let totScnqty = 0
        const rows: OrderDetailItem[] = []

        data.forEach((item) => {
          totScnqty += parseInt(String(item.Scnqty ?? 0), 10)
          rows.push(item)
        })

        const firstItem = data[0]
        setOrderInfo({
          orderNo: `ORD${firstItem.OrderId}`,
          orderDate: firstItem.OrderDateStr ?? '',
          customer: firstItem.Customer ?? '',
          totalBooks: String(firstItem.OrdYrBkCnt ?? '0'),
          totalQty: String(firstItem.OrdYrTotQty ?? '0'),
          scanned: String(totScnqty),
        })

        setTableRows(rows)
        setShowCloseBtn(totScnqty > 0)
        setScanNowDisabled(false)

        const bkOrderDtl: BkOrderData = { OrderNo: pOrderNo, FinYear: finyear }
        sessionStorage.setItem('BkOrderDtl', JSON.stringify(bkOrderDtl))
      } else if (status === 404) {
        setOrderInfo({ orderNo: '0', orderDate: '', customer: '', totalBooks: '0', totalQty: '0', scanned: '0' })
        setTableRows([])
        setShowCloseBtn(false)
        setScanNowDisabled(true)
        const errorItem = response.Data?.[0]
        setMessage(String(errorItem && !isOrderDetailItem(errorItem) ? errorItem._Error : 'Order not found'))
        setMessageColor('red')
        setOrderNo('')
        inputRef.current?.focus()
        sessionStorage.removeItem('BkOrderDtl')
      } else {
        const errorItem = response.Data?.[0]
        setMessage(String(errorItem && !isOrderDetailItem(errorItem) ? errorItem._Error : 'Invalid Order No.'))
        setMessageColor('red')
        setOrderNo('')
        inputRef.current?.focus()
        setScanNowDisabled(true)
      }
    } catch (err) {
      console.error(err)
      setMessage('Error fetching order details.')
      setMessageColor('red')
      setScanNowDisabled(true)
    } finally {
      setLoading(false)
      setOrderNo('')
      inputRef.current?.focus()
    }
  }, [finyear, orderNo, loading, clearMessage])

  const handleClose = useCallback(async () => {
    if (loading) return

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

    const data = {
      BarcodeNo: '',
      UserNm: userName,
      FinYear: bkOrderData.FinYear,
      OrderNo: bkOrderData.OrderNo,
      Qty: 0,
      BarcodeType: 'CLOSE',
    }

    try {
      const response = await apiClient.post<ScanBrcdResponse>('/ScanBrcd', data)
      const status = parseInt(String(response.Status ?? 0))

      if (status === 1 && response.Data && response.Data[0] && parseInt(String(response.Data[0].Status ?? 0)) === 1) {
        setMessage(response.Data[0].Msg ?? 'Closed successfully')
        setMessageColor('green')
      } else {
        setMessage(response.Data?.[0]?.Msg ?? 'Failed to close')
        setMessageColor('red')
      }
    } catch (err) {
      console.error(err)
      setMessage('Error closing order.')
      setMessageColor('red')
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    const saved = sessionStorage.getItem('BkOrderDtl')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.OrderNo) {
          setOrderNo(parsed.OrderNo)
        }
      } catch { }
    }

    intervalRef.current = setInterval(() => {
      if (loading) return
      const input = inputRef.current
      if (input && input.value.trim().length > 1) {
        setOrderNo(input.value.trim())
        ScanOrder()
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
  }, [ScanOrder, loading])

  const goToScan = () => {
    navigate('/bk-scanning')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Start Scanning</h1>
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
          <center>
            <form method="post" action="/" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="txtOrderNo" className="block text-sm font-medium text-slate-700 mb-2">
                Order Number
              </label>
              <input
                id="txtOrderNo"
                ref={inputRef}
                type="text"
                name="txtOrderNo"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                autoFocus
                className="w-full max-w-md px-3 py-3 text-xl text-center border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-600 focus:border-brand-600 outline-none transition-colors"
              />
              {message && (
                <p id="bkOrderMessage" className={`mt-4 text-lg font-bold text-center ${messageColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </form>
          </center>

          <p className="mt-6 mb-4 text-center text-sm font-medium text-slate-700">Order Information</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Order No:</span>
                <span className="value ml-2 font-medium text-slate-900" id="lblOrderNo">{orderInfo.orderNo}</span>
              </div>
              <div>
                <span className="text-slate-500">Order Date:</span>
                <span className="value ml-2 font-medium text-slate-900" id="lblOrderDate">{orderInfo.orderDate}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span>
                <span className="value ml-2 font-medium text-slate-900" id="lblCustomer">{orderInfo.customer}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
              <h2 className="text-2xl font-bold text-brand-700" id="lblTotalBooks">{orderInfo.totalBooks}</h2>
              <p className="text-sm text-brand-600">TOTAL BOOKS</p>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
              <h2 className="text-2xl font-bold text-brand-700" id="lblTotalQty">{orderInfo.totalQty}</h2>
              <p className="text-sm text-brand-600">TOTAL QTY</p>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
              <h2 className="text-2xl font-bold text-brand-700" id="lblScanned">{orderInfo.scanned}</h2>
              <p className="text-sm text-brand-600">SCANNED</p>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-slate-200 rounded-lg">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Book</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Quantity</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Scanned</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-left text-xs font-medium text-slate-500">Balance</th>
                </tr>
              </thead>
              <tbody id="bkOrdTblBdy">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No order data</td>
                  </tr>
                ) : (
                  tableRows.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="bk-book-row border-b border-slate-100">
                        <td colSpan={3} className="px-4 py-2 font-medium text-slate-900 bk-book-name">
                          {item.Title}
                        </td>
                      </tr>
                      <tr className="bk-details-row border-b border-slate-100">
                        <td className="px-4 py-1"></td>
                        <td className="px-4 py-1 text-slate-700">{item.Qty}</td>
                        <td className="px-4 py-1 text-slate-700">{item.Scnqty}</td>
                        <td className="px-4 py-1 text-slate-700">{item.Balqty}</td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              id="btnScnNow"
              onClick={goToScan}
              disabled={scanNowDisabled || loading}
              className="w-full h-[50px] rounded-[25px] bg-brand-600 text-white text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: 25 }}
            >
              Scan Now
            </button>
            {showCloseBtn && (
              <button
                id="btnBkClose"
                onClick={handleClose}
                disabled={loading}
                className="w-full h-[50px] rounded-[25px] bg-red-600 text-white text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: 25 }}
              >
                Close
              </button>
            )}
            <Link to="/bk-scanning" id="to_bkScanning" className="hidden" />
          </div>
        </div>
      </main>
    </div>
  )
}