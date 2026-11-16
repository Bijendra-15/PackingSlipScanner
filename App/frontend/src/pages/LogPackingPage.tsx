import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

interface Vehicle {
  VEHICLE_NO: string
}

export function LogPackingPage() {
  const navigate = useNavigate()
  const [vehicleNo, setVehicleNo] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (vehicleNo.length > 8) {
        goOnBarCodeScan()
      }
    }, 500)
    return () => clearInterval(timer)
  }, [vehicleNo])

  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('txtScanVehicleno') as HTMLInputElement | null
      if (input) {
        input.removeAttribute('readonly')
        input.focus()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const loadVehicles = async () => {
    try {
      const res = await apiClient.get<any>('/GetAllDistVehiForOpen')
      const data = res.Data ?? res.data
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.log(err)
    }
  }

  const goOnBarCodeScan = async () => {
    if (scanning) return
    setScanning(true)
    let pVehicleNo = vehicleNo
    if (pVehicleNo.indexOf('#') > -1) {
      pVehicleNo = pVehicleNo.slice(0, -1)
    }

    try {
      const res = await apiClient.get<any>(
        `/ChkVehicleNoExistOrNot/${encodeURIComponent(pVehicleNo)}`
      )
      const data = res.Data ?? res.data
      const count = parseInt(String(data), 10)

      if (count > 0) {
        setError('This Vehicle No Already Scanned.')
      } else {
        navigate(`/barcode-scan?pVehicleNO=${pVehicleNo}`)
      }
    } catch (err) {
      console.log(err)
    } finally {
      setVehicleNo('')
      setScanning(false)
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
        <h1 className="text-sm font-medium text-slate-900">Scanned Vehicle</h1>
        <div className="w-6 h-6" />
      </header>

      {error && (
        <div className="mb-3 text-center text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-3">
        <label htmlFor="txtScanVehicleno" className="block text-sm font-medium text-slate-700">
          Scan Vehicle No :
        </label>
        <input
          id="txtScanVehicleno"
          type="text"
          value={vehicleNo}
          onChange={e => setVehicleNo(e.target.value)}
          readOnly
          autoComplete="off"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
        />

        <h4 className="text-sm font-medium text-slate-700 mt-4">Or Resume With...</h4>
        <ul className="divide-y divide-slate-200">
          {vehicles.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              No Vehicle Available
            </li>
          ) : (
            vehicles.map((v) => (
              <li key={v.VEHICLE_NO}>
                <button
                  onClick={() => navigate(`/barcode-scan?pVehicleNO=${v.VEHICLE_NO}`)}
                  className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-slate-50 hover:underline transition-colors"
                >
                  {v.VEHICLE_NO}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <footer className="mt-10 pt-4 border-t text-center text-xs text-slate-500">
        Shivalal & Comp.
      </footer>
    </div>
  )
}
