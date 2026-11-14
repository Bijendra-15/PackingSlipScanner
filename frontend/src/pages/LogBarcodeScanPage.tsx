import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'

interface BarcodeRow {
  BARCODE: string
  QTY: string
  TOT_CARTONS: string
}

export function LogBarcodeScanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [vehicleNo, setVehicleNo] = useState('')
  const [barcode, setBarcode] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [barcodes, setBarcodes] = useState<BarcodeRow[]>([])
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const pVehicleNo = searchParams.get('pVehicleNO') || ''
    setVehicleNo(pVehicleNo)
    clearMessages()
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('txtbarcode') as HTMLInputElement | null
      if (input) {
        input.removeAttribute('readonly')
        input.select()
        input.focus()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (barcode.length > 8) {
        validateBarcode()
      }
    }, 500)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [barcode])

  const clearMessages = () => {
    setStatusMsg('')
  }

  const validateBarcode = async () => {
    clearMessages()
    let pBarcodeNo = barcode
    if (pBarcodeNo.indexOf('#') > -1) {
      pBarcodeNo = pBarcodeNo.slice(0, -1)
    }

    try {
      const res = await apiClient.post<any>('/ValidateBarCodeAndSave', {
        BARCODE: pBarcodeNo,
        VEHICLE_NO: vehicleNo,
        CR_BY: user?.UserName ?? '',
        DEVICE_ID: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      })
      const data = res.Data ?? res.data
      const status = parseInt(String(data?.Status ?? 0), 10)

      if (status === 1) {
        setStatusMsg('Success')
        setBarcodes((prev) => [
          ...prev,
          {
            BARCODE: pBarcodeNo,
            QTY: data.qty ?? '0',
            TOT_CARTONS: data.TotCartScanned ?? '0'
          }
        ])
      } else if (status === -1) {
        setStatusMsg('Barcode Already Scanned.')
      } else if (status === -2) {
        setStatusMsg('Barcode is belongs to different gst percentage so add in new challan.')
      } else {
        setStatusMsg('Invalid Barcode.')
      }

    } catch (err) {
      console.log(err)
    } finally {
      setBarcode('')
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
        <h1 className="text-sm font-medium text-slate-900">Barcode Scan</h1>
        <div className="w-6 h-6" />
      </header>

      <form autoComplete="off" className="space-y-3">
        <div className="ui-field-contain">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 text-right">Vehicle Number</span>
            <p id="pdisplayvehicleno" className="font-medium text-slate-900">
              {vehicleNo}
            </p>
          </div>
          <input
            id="txtbarcode"
            type="text"
            placeholder="Enter Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            readOnly
            autoComplete="off"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        {statusMsg && (
          <p id="apistatusmsg" className="font-bold text-center text-sm text-green-600">
            {statusMsg}
          </p>
        )}

        <table className="table-auto w-full divide-y divide-slate-200 tblbarcodes">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-xs font-medium text-slate-500 text-left">Barcode</th>
              <th className="px-3 py-2 text-xs font-medium text-slate-500 text-left">Qty</th>
              <th className="px-3 py-2 text-xs font-medium text-slate-500 text-left">Total Cartons</th>
            </tr>
          </thead>
          <tbody>
            {barcodes.map((row, idx) => (
              <tr key={idx} className="text-sm text-slate-700">
                <td className="px-3 py-2">{row.BARCODE}</td>
                <td className="px-3 py-2">{row.QTY}</td>
                <td className="px-3 py-2">{row.TOT_CARTONS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>

      <footer className="mt-10 pt-4 border-t text-center text-xs text-slate-500">
        Shivalal & Comp.
      </footer>
    </div>
  )
}
