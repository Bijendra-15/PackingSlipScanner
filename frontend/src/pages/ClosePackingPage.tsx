import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

interface ClosePackRow {
  BARCODE: string
  CARTON_QTY: string
  PageNo: string
}

export function closepacking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [vehicleNo, setVehicleNo] = useState('')
  const [packings, setPackings] = useState<ClosePackRow[]>([])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const vno = searchParams.get('vehicleNo') || ''
    setVehicleNo(vno)
    setMsg('')
    loadPackings(vno)
  }, [searchParams])

  const loadPackings = async (vno: string) => {
    if (!vno) return
    try {
      const res = await apiClient.get<any>(`/GetVehiForOpen/${encodeURIComponent(vno)}`)
      const data = res.Data ?? res.data ?? res
      setPackings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.log(err)
    }
  }

  const updateVehicle = async () => {
    setMsg('')
    try {
      const res = await apiClient.post<any>(`/UpdateVehicle/${encodeURIComponent(vehicleNo)}`, {})
      const data = res.Data ?? res.data ?? res
      const msgText = data?.Status ?? data?.Data ?? 'Vehicle closed successfully'
      setMsg(msgText)
      setMsgType('success')
      loadPackings(vehicleNo)
    } catch (err: any) {
      setMsg(err.response?.data?.Data ?? err.message ?? 'Failed to close vehicle')
      setMsgType('error')
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-brand-600 hover:text-brand-700"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-medium text-slate-900">Close Packing</h1>
        <div className="w-6 h-6" />
      </header>

      <p id="pvwpackingvehicle" className="text-center text-sm font-medium text-slate-700 mb-4">
        {vehicleNo}
      </p>

      {packings.length > 0 && (
        <p className="text-center text-sm font-medium text-slate-700 mb-2">
          Total Cartons: {packings.find((r) => r.BARCODE === 'TOTAL')?.PageNo ?? 0}
        </p>
      )}

      {msg && (
        <p className={`text-center text-sm font-medium mb-4 ${msgType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}

      <div className="space-y-2">
        {packings.length > 0 ? (
          <table className="table-auto w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1 text-xs font-bold text-slate-500 text-left">Barcode</th>
                <th className="px-2 py-1 text-xs font-bold text-slate-500 text-left">Qty</th>
              </tr>
            </thead>
            <tbody>
              {packings.map((row, idx) => (
                <tr
                  key={idx}
                  className={`text-xs text-slate-700 ${row.BARCODE === 'TOTAL' ? 'font-bold' : ''}`}
                >
                  <td className={`px-2 py-1 ${row.BARCODE === 'TOTAL' ? 'font-bold' : ''}`}>
                    {row.BARCODE}
                  </td>
                  <td className={`px-2 py-1 ${row.BARCODE === 'TOTAL' ? 'font-bold' : ''}`}>
                    {row.CARTON_QTY}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-3 py-2 text-sm text-slate-500 text-center">
            No Packing Details Available
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={updateVehicle}
          className="w-[150px] h-[50px] rounded-[25px] bg-brand-600 text-white flex items-center justify-center gap-2"
        >
          <span style={{ fontSize: '16px' }}>Close</span>
        </button>
      </div>

      <footer className="mt-10 pt-4 border-t text-center text-xs text-slate-500">
        Shivalal & Comp.
      </footer>
    </div>
  )
}
