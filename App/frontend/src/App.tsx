import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { LogPackingPage } from '@/pages/LogPackingPage'
import { LogBarcodeScanPage } from '@/pages/LogBarcodeScanPage'
import { ViewPackingVehicles } from '@/pages/ViewPackingVehiclesPage'
import { ViewPackingPage } from '@/pages/ViewPackingPage'
import { Closedispatch } from '@/pages/CloseDispatchPage'
import { closepacking as ClosePackingPage } from '@/pages/ClosePackingPage'
import { SlipsListPage } from '@/pages/SlipsListPage'
import { SlipDetailPage } from '@/pages/SlipDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { FinyearPage } from '@/pages/FinyearPage'
import { RecvDashboard as RecvDashboardPage } from '@/pages/RecvDashboardPage'
import { ScanChallanNo } from '@/pages/ScanChallanNoPage'
import { ViewReceivedBarcode } from '@/pages/ViewReceivedBarcodePage'
import { ScanCartonBarCode } from '@/pages/ScanCartonBarCode'
import { DispatchInvoice } from '@/pages/DispatchInvoicePage'
import { DispatchScanCarton } from '@/pages/DispatchScanCarton'
import { ReviewDispatch } from '@/pages/ReviewDispatch'
import { makeTransferChallan as MakeTransferChallan } from '@/pages/makeTransferChallan'
import { TrChallanScanCarton } from '@/pages/TrChallanScanCarton'
import { reviewTrChallanReq as ReviewTrChallanReq } from '@/pages/reviewTrChallanReq'
import { profile as Profile } from '@/pages/profile'
import { stockinput as Stockinput } from '@/pages/stockinput'
import { stkinput as Stkinput } from '@/pages/stkinput'
import { BkOrder } from '@/pages/bkOrder'
import { BkScanning } from '@/pages/bkScanning'

function FinyearRoute({ children }: { children: React.ReactNode }) {
  const user = useAuth().user
  const allowed = user && (user.RoleId === 23 || user.RoleId === 24)
  return allowed ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route index element={<DashboardPage />} />
            <Route path="logpacking" element={<LogPackingPage />} />
            <Route path="barcode-scan" element={<LogBarcodeScanPage />} />
            <Route path="viewpackingvehicles" element={<ViewPackingVehicles />} />
            <Route path="viewpacking" element={<ViewPackingPage />} />
            <Route path="closedispatch" element={<Closedispatch />} />
            <Route path="closepacking" element={<ClosePackingPage />} />
            <Route path="slips" element={<SlipsListPage />} />
            <Route path="slips/:id" element={<SlipDetailPage />} />
            <Route
              path="finyear"
              element={
                <FinyearRoute>
                  <FinyearPage />
                </FinyearRoute>
              }
            />
            <Route path="recv-dashboard" element={<RecvDashboardPage />} />
            <Route path="scan-challan-no" element={<ScanChallanNo />} />
            <Route path="scan-carton-barcode" element={<ScanCartonBarCode />} />
            <Route path="view-received-barcode" element={<ViewReceivedBarcode />} />
            <Route path="dispatchinvoice" element={<DispatchInvoice />} />
            <Route path="dispatch-scan-carton" element={<DispatchScanCarton />} />
            <Route path="review-dispatch" element={<ReviewDispatch />} />
            <Route path="make-transfer-challan" element={<MakeTransferChallan />} />
            <Route path="tr-challan-scan-carton" element={<TrChallanScanCarton />} />
            <Route path="review-tr-challan" element={<ReviewTrChallanReq />} />
            <Route path="profile" element={<Profile />} />
            <Route path="verify-carton" element={<Stockinput />} />
            <Route path="stk-input" element={<Stkinput />} />
            <Route path="bk-order" element={<BkOrder />} />
            <Route path="bk-scanning" element={<BkScanning />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
