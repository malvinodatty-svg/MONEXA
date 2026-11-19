// Data dummy untuk MODE DEMO — dipakai selama backend (M2) belum tersedia.
// Matikan dengan set VITE_USE_MOCK=false di .env.local begitu API asli sudah siap.

export const MOCK_WALLET = {
  balance: 2450000,
  walletId: "MX-8827-2201",
}

export const MOCK_TRANSACTIONS = [
  {
    id: "TRX-20260929-0091",
    type: "TRANSFER" as const,
    title: "Transfer ke Raka",
    time: "Hari ini, 09:41",
    timestamp: "29 Sep 2026, 09:41 WIB",
    amount: -150000,
    status: "SUCCESS" as const,
    receiptUrl: "#",
  },
  {
    id: "TRX-20260928-0090",
    type: "TOPUP" as const,
    title: "Top Up via Bank",
    time: "Kemarin, 18:02",
    timestamp: "28 Sep 2026, 18:02 WIB",
    amount: 500000,
    status: "SUCCESS" as const,
    receiptUrl: "#",
  },
  {
    id: "TRX-20260928-0089",
    type: "PAYMENT" as const,
    title: "Bayar Merchant Kopi",
    time: "Kemarin, 07:15",
    timestamp: "28 Sep 2026, 07:15 WIB",
    amount: -32000,
    status: "PENDING" as const,
  },
  {
    id: "TRX-20260927-0088",
    type: "TRANSFER" as const,
    title: "Transfer dari Dzakwan",
    time: "2 hari lalu",
    timestamp: "27 Sep 2026, 14:00 WIB",
    amount: 200000,
    status: "SUCCESS" as const,
    receiptUrl: "#",
  },
  {
    id: "TRX-20260926-0087",
    type: "PAYMENT" as const,
    title: "Bayar Merchant Buku",
    time: "3 hari lalu",
    timestamp: "26 Sep 2026, 11:20 WIB",
    amount: -85000,
    status: "FAILED" as const,
  },
  {
    id: "TRX-20260925-0086",
    type: "TOPUP" as const,
    title: "Top Up via QRIS",
    time: "4 hari lalu",
    timestamp: "25 Sep 2026, 08:05 WIB",
    amount: 1000000,
    status: "SUCCESS" as const,
    receiptUrl: "#",
  },
]

export function delay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"
