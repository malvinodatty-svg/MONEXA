import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { ArrowDownToLine, ArrowLeftRight, ScanLine, History as HistoryIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { USE_MOCK, MOCK_WALLET, MOCK_TRANSACTIONS, delay } from "@/lib/mock/data"

interface Wallet {
  balance: number
  walletId: string
}

interface Transaction {
  id: string
  title: string
  time: string
  amount: number
  status: "SUCCESS" | "PENDING" | "FAILED"
}

async function fetchWallet(): Promise<Wallet> {
  if (USE_MOCK) return delay(MOCK_WALLET)
  const res = await api.get("/wallet/balance")
  return res.data
}

async function fetchRecentTransactions(): Promise<Transaction[]> {
  if (USE_MOCK) return delay(MOCK_TRANSACTIONS.slice(0, 3))
  const res = await api.get("/transactions", { params: { limit: 3 } })
  return res.data
}

const statusVariant: Record<Transaction["status"], "success" | "pending" | "failed"> = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
}

const quickActions = [
  { to: "/topup", label: "Top Up", icon: ArrowDownToLine },
  { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { to: "/payment", label: "Bayar", icon: ScanLine },
  { to: "/history", label: "Riwayat", icon: HistoryIcon },
]

export default function DashboardPage() {
  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  })

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: fetchRecentTransactions,
  })

  return (
    <div className="flex flex-col gap-5 px-6 pt-8">
      <Card className="bg-brand p-6 text-white">
        <p className="text-xs opacity-75">Saldo Wallet</p>
        {loadingWallet ? (
          <div className="mt-2 h-8 w-40 animate-pulse rounded bg-white/20" />
        ) : (
          <p className="mt-1 text-3xl font-bold">
            Rp {wallet?.balance?.toLocaleString("id-ID") ?? "0"}
          </p>
        )}
        <p className="mt-2 text-xs opacity-65">Wallet ID · {wallet?.walletId ?? "-"}</p>
      </Card>

      <div className="grid grid-cols-4 gap-3">
        {quickActions.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-border bg-surface p-3">
              <Icon size={20} className="text-brand" />
            </div>
            <span className="text-[11px] text-text">{label}</span>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">Transaksi Terbaru</h2>
          <Link to="/history" className="text-xs font-semibold text-brand">
            Lihat semua
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {loadingTx && (
            <>
              <div className="h-16 animate-pulse rounded-2xl bg-surface" />
              <div className="h-16 animate-pulse rounded-2xl bg-surface" />
            </>
          )}

          {!loadingTx && transactions?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Belum ada transaksi</p>
          )}

          {transactions?.map((tx) => (
            <Link
              key={tx.id}
              to={`/transaction/${tx.id}`}
              className="flex items-center justify-between rounded-2xl bg-surface p-4"
            >
              <div>
                <p className="text-sm font-semibold">{tx.title}</p>
                <p className="mt-0.5 text-[11px] text-muted">{tx.time}</p>
              </div>
              <div className="text-right">
                <p className={tx.amount < 0 ? "font-bold text-failed" : "font-bold text-success"}>
                  {tx.amount < 0 ? "- " : "+ "}Rp{Math.abs(tx.amount).toLocaleString("id-ID")}
                </p>
                <Badge variant={statusVariant[tx.status]} className="mt-1">
                  {tx.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
