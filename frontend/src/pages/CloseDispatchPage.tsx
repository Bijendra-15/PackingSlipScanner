import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

interface Vehicle {
  VEHICLE_NO: string
}

export function Closedispatch() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<any>('/GetAllDistVehiForOpen')
        const data = res.Data ?? res.data ?? res
        setVehicles(Array.isArray(data) ? data : [])
      } catch (err) {
        setError('Failed to load vehicles')
        console.log(err)
      }
    }
    load()
  }, [])

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
        <h1 className="text-sm font-medium text-slate-900">Close Packing Vehicles</h1>
        <div className="w-6 h-6" />
      </header>

      <p className="text-center text-sm font-medium text-slate-700 mb-4">
        Click On Vehicle No To Close The Packing
      </p>

      {error && (
        <div className="mb-3 text-center text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-2">
        <ul className="divide-y divide-slate-200">
          {vehicles.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500 text-center">
              No Vehicle Available
            </li>
          ) : (
            vehicles.map((v) => (
              <li key={v.VEHICLE_NO}>
                <button
                  onClick={() => navigate(`/closepacking?vehicleNo=${v.VEHICLE_NO}`)}
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
