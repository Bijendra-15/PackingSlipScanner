import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

interface PackingRow {
  BARCODE: string
  CARTON_QTY: string
  NOTEBOOK_NM: string
  PageNo: string
}

export function ViewPackingPage() {
  const [searchParams] = useSearchParams()
  const [vehicleNo, setVehicleNo] = useState('')
  const [packings, setPackings] = useState<PackingRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const vno = searchParams.get('vehicleNo') || ''
    setVehicleNo(vno)
    loadPackings(vno)
  }, [searchParams])

  const loadPackings = async (vno: string) => {
    if (!vno) return
    try {
      const res = await apiClient.get<any>(`/GetVehiForOpen/${encodeURIComponent(vno)}`)
      const data = res.Data ?? res.data ?? res
      setPackings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load packing details')
      console.log(err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2" />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-lg font-bold text-slate-900 text-center">
                View Packing
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
          <p id="pvwpackingvehicle" className="text-center text-sm font-medium text-slate-700 mb-4">
            {vehicleNo}
          </p>

          {packings.length > 0 && (
            <p className="text-center text-sm font-medium text-slate-700 mb-2">
              Total Cartons: {packings.find((r) => r.BARCODE === 'TOTAL')?.PageNo ?? 0}
            </p>
          )}

          {error && (
            <div className="mb-3 text-center text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-2">
            {packings.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 text-center">
                No Packing Details Available
              </li>
            ) : (
              <table className="table-auto w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1 text-xs font-medium text-slate-500 text-left">
                      Barcode
                    </th>
                    <th className="px-2 py-1 text-xs font-medium text-slate-500 text-left">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packings
                    .filter((r) => r.BARCODE !== 'TOTAL')
                    .map((row, idx) => (
                      <tr key={idx} className="text-xs text-slate-700">
                        <td className="px-2 py-1">{row.BARCODE}</td>
                        <td className="px-2 py-1">{row.CARTON_QTY}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className="mt-10 pt-4 border-t text-center text-xs text-slate-500">
            Shivalal & Comp.
          </footer>
        </div>
      </main>
    </div>
  )
}
