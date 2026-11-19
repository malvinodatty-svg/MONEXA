import { Routes, Route, Navigate } from "react-router-dom"

import { AppLayout } from "@/layouts/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"

import LoginPage from "@/pages/Login"
import RegisterPage from "@/pages/Register"
import DashboardPage from "@/pages/Dashboard"
import TopUpPage from "@/pages/TopUp"
import TransferPage from "@/pages/Transfer"
import PaymentPage from "@/pages/Payment"
import HistoryPage from "@/pages/History"
import TransactionDetailPage from "@/pages/TransactionDetail"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Halaman yang butuh JWT - otomatis redirect ke /login jika belum masuk */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/topup" element={<TopUpPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/transaction/:id" element={<TransactionDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
