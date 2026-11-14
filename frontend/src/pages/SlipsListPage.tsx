import { useQuery } from '@tanstack/react-query'
import { packSlipApi } from '@/services/packSlipApi'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Edit, Trash2, Package, User, Hash } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  picked: { label: 'Picked', color: 'bg-blue-100 text-blue-700' },
  packed: { label: 'Packed', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Shipped', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export function SlipsListPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['packslips'],
    queryFn: () => packSlipApi.getAll({ limit: 50 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packSlipApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packslips'] }),
  })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load pack slips. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pack Slips</h1>
          <p className="text-slate-600 mt-1">Manage all your pack slips</p>
        </div>
        <Link
          to="/scan"
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          + New Scan
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : data && data.data.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Slip Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.data.map((slip) => {
                  const config = statusConfig[slip.status] || statusConfig.pending
                  return (
                    <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{slip.slipNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{slip.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/slips/${slip.id}`)}
                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            aria-label="View details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this pack slip?')) {
                                deleteMutation.mutate(slip.id)
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No pack slips found</h3>
          <p className="text-slate-500 mb-6">Get started by scanning your first pack slip</p>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            Scan a Slip
          </Link>
        </div>
      )}
    </div>
  )
}