import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLogout } from '@/services/logoutApi'
import {
  Power,
  User,
  Package,
  Eye,
  Layout,
  Truck,
  List,
  FileText,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react'

const sections = [
  {
    label: 'Challan',
    items: [
      {
        id: 'receive-challan',
        label: 'Receive Challan',
        icon: Package,
        to: '/scan-challan-no',
      },
      {
        id: 'review-challan',
        label: 'Review Challan',
        icon: Eye,
        to: '/view-received-barcode',
      },
      {
        id: 'view-difference',
        label: 'View Difference',
        icon: Layout,
        to: '/viewpacking',
      },
    ],
  },
  {
    label: 'Dispatch',
    items: [
      {
        id: 'dispatch-invoice',
        label: 'Dispatch Invoice',
        icon: Truck,
        to: '/dispatchinvoice',
      },
      {
        id: 'review-dispatch',
        label: 'Review Dispatch',
        icon: Eye,
        to: '/review-dispatch',
      },
    ],
  },
  {
    label: 'Transfer Challan',
    items: [
      {
        id: 'make-transfer-challan',
        label: 'Make Transfer Challan',
        icon: List,
        to: '/make-transfer-challan',
      },
      {
        id: 'review-transfer-challan',
        label: 'Review Transfer Challan',
        icon: Eye,
        to: '/review-tr-challan',
      },
    ],
  },
  {
    label: 'Stock',
    items: [
      {
        id: 'verify-carton',
        label: 'Verify Carton',
        icon: ShieldAlert,
        to: '/verify-carton',
      },
      {
        id: 'stock-input',
        label: 'Stock Input',
        icon: FileText,
        to: '/stk-input',
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        to: '/profile',
      },
    ],
  },
]

export function RecvDashboard() {
  const { user } = useAuth()
  const handleLogout = useLogout()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const displayName = user?.UserName ?? ''

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  const isActive = (index: number) => activeIndex === index

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/images/logo-login.png" alt="Logo" className="h-10 w-auto" />
            </div>

            <div className="flex-1 flex items-center justify-center">
              &nbsp;
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-[10px] text-slate-500 font-medium">Welcome :</div>
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-slate-100 rounded-full text-slate-500">
                <User className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
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
        <div className="bg-white border border-slate-200 shadow-sm">
          <div className="ui-grid-a" style={{ width: '100%' }}>
            {sections.map((section, sIdx) => {
              const isOpen = isActive(sIdx)
              return (
                <div key={section.label}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion(sIdx)}
                    className="w-full flex items-center justify-between px-6 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <span>{section.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`px-6 pb-3 pt-3 border-b border-slate-100 transition-all duration-200 ease-in-out ${isOpen
                      ? 'block opacity-100 mt-0'
                      : 'hidden opacity-0 mt-1 negative-mt'
                      }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {section.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.to}
                          className="flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl border border-slate-200 bg-white hover:bg-brand-50 hover:border-brand-200 transition-colors group"
                        >
                          <item.icon className="w-8 h-8 text-brand-600 group-hover:text-brand-700" />
                          <span className="text-xs font-medium text-slate-700 text-center leading-tight group-hover:text-brand-700">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
