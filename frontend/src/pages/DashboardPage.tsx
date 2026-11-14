import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLogout } from '@/services/logoutApi'
import { LogOut } from 'lucide-react'

export function DashboardPage() {
  useAuth()
  const handleLogout = useLogout()
  const navigate = useNavigate()

  const doLogout = () => {
    handleLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center space-y-6">
        <img src="/images/Dashboard-logo.png" alt="profile" className="mx-auto" />
        <p className="font-bold text-slate-900">PACKING SLIP SCANNING APPLICATION</p>
        <div className="space-y-4">
          <Link to="/logpacking" className="block">
            <button className="w-[150px] h-[50px] rounded-[25px] bg-brand-600 text-white">Log Dispatch</button>
          </Link>
          <Link to="/viewpackingvehicles" className="block">
            <button className="w-[150px] h-[50px] rounded-[25px] bg-brand-600 text-white">View Dispatch</button>
          </Link>
          <Link to="/closedispatch" className="block">
            <button className="w-[150px] h-[50px] rounded-[25px] bg-brand-600 text-white">Closed Dispatch</button>
          </Link>
        </div>
        <button
          onClick={doLogout}
          className="w-[150px] h-[50px] rounded-[25px] bg-red-600 text-white flex items-center justify-center gap-2 mx-auto mt-8"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
