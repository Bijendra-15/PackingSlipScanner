import { useState } from 'react'
import { packSlipApi } from '@/services/packSlipApi'
import { type ScanRequest } from '@/types/packSlip'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { CheckCircle, AlertCircle, Camera, Barcode } from 'lucide-react'

export function ScanPage() {
  const [slipNumber, setSlipNumber] = useState('')
  const [location, setLocation] = useState('')
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)

  const scanMutation = useMutation({
    mutationFn: (data: ScanRequest) => packSlipApi.scan(data),
    onSuccess: (result) => {
      setScanResult({ success: true, message: result.message })
      queryClient.invalidateQueries({ queryKey: ['packslips'] })
      setSlipNumber('')
      setLocation('')
    },
    onError: (error: Error) => {
      setScanResult({ success: false, message: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setScanResult(null)
    scanMutation.mutate({ slipNumber: slipNumber.trim(), location: location.trim() || undefined })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full mb-4">
          <Barcode className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Scan Pack Slip</h1>
        <p className="text-slate-600 mt-2">Enter the slip number to scan and process it</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="slipNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Slip Number *
            </label>
            <input
              id="slipNumber"
              type="text"
              value={slipNumber}
              onChange={(e) => setSlipNumber(e.target.value)}
              placeholder="e.g. PS-2024-0001"
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
              disabled={scanMutation.isPending}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
              Location (optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Warehouse A, Shelf 3"
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
              disabled={scanMutation.isPending}
            />
          </div>

          {scanResult && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                scanResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm font-medium ${
                  scanResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {scanResult.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={scanMutation.isPending || !slipNumber.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5" />
            {scanMutation.isPending ? 'Scanning...' : 'Scan Slip'}
          </button>
        </form>
      </div>
    </div>
  )
}