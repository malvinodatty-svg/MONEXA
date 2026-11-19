import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"
import { USE_MOCK, MOCK_TRANSACTIONS, delay } from "@/lib/mock/data"

type FilterType = "ALL" | "TOPUP" | "TRANSFER" | "PAYMENT"

interface Transaction {
  id: string
  title: string
  time: string
  amount: number
  status: "SUCCESS" | "PENDING" | "FAILED"
  type: Exclude<FilterType, "ALL">
}

const filters: { key: FilterType; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "TOPUP", label: "Top Up" },
  { key: "TRANSFER", label: "Transfer" },
  { key: "PAYMENT", label: "Bayar" },
]

const statusVariant = { SUCCESS: "success", PENDING: "pending", FAILED: "failed" } as const

async function fetchTransactions(filter: FilterType): Promise<Transaction[]> {
  if (USE_MOCK) {
    const data = filter === "ALL" ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.filter((t) => t.type === filter)
    return delay(data)
  }
  const res = await api.get("/transactions", {
    params: filter === "ALL" ? {} : { type: filter },
  })
  return res.data
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("ALL")

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", filter],
    queryFn: () => fetchTransactions(filter),
  })

  return (
    <div className="flex flex-col gap-4 px-6 pt-8">
      <h1 className="text-lg font-bold">Riwayat Transaksi</h1>

      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "whitespace-nowrap rounded-full border border-border px-4 py-2 text-xs font-semibold",
              filter === f.key ? "bg-brand text-white border-brand" : "bg-surface text-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
          ))}

        {!isLoading && transactions?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Belum ada transaksi</p>
        )}

        {transactions?.map((tx) => (
          <Link
            key={tx.id}
            to={`/transaction/${tx.id}`}
            className="flex items-center justify-between rounded-2xl bg-surface p-4"
          >
            <div>
              <p className="text-sm font-semibold">{tx.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {tx.time} · {tx.id}
              </p>
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
  )
}
