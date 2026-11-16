import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { packSlipApi } from '@/services/packSlipApi'
import { Package, User, ArrowLeft, Printer, Edit2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  picked: { label: 'Picked', color: 'bg-blue-100 text-blue-700' },
  packed: { label: 'Packed', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Shipped', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export function SlipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['packslip', id],
    queryFn: () => packSlipApi.getByNumber(id as string),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => packSlipApi.remove(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packslips'] })
      navigate('/slips', { replace: true })
    },
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full text-center">
          <Package className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Pack slip not found</h2>
          <p className="text-red-700 mb-6">The requested pack slip could not be loaded.</p>
          <Link to="/slips" className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to slips
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  const config = statusConfig[data.status] || statusConfig.pending

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/slips" className="btn-ghost text-sm mb-4 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to slips
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pack Slip #{data.slipNumber}</h1>
            <p className="text-slate-600 mt-1">{data.customerName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger text-sm"
              aria-label="Delete pack slip"
            >
              <Printer className="w-4 h-4" /> Delete
            </button>
            <Link to="/slips" className="btn-primary text-sm">
              <Edit2 className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span className={`badge ${config.color}`}>{config.label}</span>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{data.createdAt.slice(0, 10)}</p>
              <p className="text-xs text-slate-500">Created</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Slip number</p>
              <p className="text-lg font-medium text-slate-900">{data.slipNumber}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-900">{data.customerName}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order number</p>
              <p className="text-lg font-medium text-slate-900">{data.orderNumber || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status</p>
              <div className="flex items-center gap-2">
                <span className={`badge ${config.color}`}>{config.label}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Items</h2>
              <span className="text-sm font-medium text-slate-500">{data.items.length} item{data.items.length !== 1 ? 's' : ''}</span>
            </div>
            {data.items.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
                <Package className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No items on this pack slip.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((item) => (
                      <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{item.sku}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{item.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-900">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">{item.location || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
