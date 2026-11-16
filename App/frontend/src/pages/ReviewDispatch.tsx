import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { Home, Power } from 'lucide-react'

interface ReviewDispatchItem {
  Orderid?: string | number
  OrderId?: string | number
  Orderfinyear?: string
  OrderFinYear?: string
  Barcode?: string
  Notebookcode?: string
  NotebookCode?: string
  Qty?: number | string
}

interface ApiResponse<T = unknown> {
  Status?: string | number
  Data?: T
}

export function ReviewDispatch() {
  const navigate = useNavigate()

  const [items, setItems] = useState<ReviewDispatchItem[]>([])
  const [loading, setLoading] = useState(false)

  const p_BindRvwDispDataInTbl = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<ApiResponse<ReviewDispatchItem[]>>('/ReviewDispatch/')
      setItems(Array.isArray(response.Data) ? response.Data : [])
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const func_GoToDispScan = useCallback(async (orderid: string | number, orderfinyear: string) => {
    const data = {
      OrderNo: orderid,
      FinYear: orderfinyear,
    }
    try {
      const response = await apiClient.post<ApiResponse<unknown>>('/ScanOrderNo/', data)
      if (parseInt(String(response.Status ?? 0)) === 1) {
        sessionStorage.setItem('ScanOrderNo', JSON.stringify(response.Data))
        navigate('/dispatch-scan-carton')
      }
    } catch (err) {
      console.error(err)
    }
  }, [navigate])

  useEffect(() => {
    void p_BindRvwDispDataInTbl()
  }, [p_BindRvwDispDataInTbl])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                List Of Open Dispatches
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
            <div className="tblRvwDispGrid overflow-x-auto">
              <table id="tblReviewDispatch" className="w-full text-left border-collapse border border-slate-200 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Order No</th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Scanned Carton</th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Notebook Code</th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Quantity</th>
                    <th className="px-4 py-2 bg-slate-50 text-slate-600 font-medium border-b border-slate-200">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((v, i) => {
                    const orderid = v.Orderid ?? v.OrderId ?? ''
                    const orderfinyear = v.Orderfinyear ?? v.OrderFinYear ?? ''
                    return (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="px-4 py-2 text-slate-700">{orderid}/{orderfinyear}</td>
                        <td className="px-4 py-2 text-slate-700">{v.Barcode ?? ''}</td>
                        <td className="px-4 py-2 text-slate-700">{v.Notebookcode ?? v.NotebookCode ?? ''}</td>
                        <td className="px-4 py-2 text-slate-700">{v.Qty ?? ''}</td>
                        <td className="px-4 py-2">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              void func_GoToDispScan(orderid, orderfinyear)
                            }}
                            className="text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                        {loading ? 'Loading...' : 'No open dispatches'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </center>
        </div>
      </main>
    </div>
  )
}