import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { USE_MOCK, MOCK_TRANSACTIONS, delay } from "@/lib/mock/data"

interface TransactionDetail {
  id: string
  type: string
  title: string
  timestamp: string
  amount: number
  status: "SUCCESS" | "PENDING" | "FAILED"
  receiptUrl?: string // dari object storage (R11)
}

async function fetchTransactionDetail(id: string): Promise<TransactionDetail> {
  if (USE_MOCK) {
    const found = MOCK_TRANSACTIONS.find((t) => t.id === id) ?? MOCK_TRANSACTIONS[0]
    return delay(found)
  }
  const res = await api.get(`/transactions/${id}`)
  return res.data
}

const statusVariant = { SUCCESS: "success", PENDING: "pending", FAILED: "failed" } as const

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: tx, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransactionDetail(id!),
    enabled: !!id,
  })

  return (
    <div className="flex flex-col gap-6 px-6 pt-8">
      <div className="flex items-center gap-3">
        <Link to="/history"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Detail Transaksi</h1>
      </div>

      {isLoading && <div className="h-48 animate-pulse rounded-2xl bg-surface" />}

      {tx && (
        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5 text-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="font-semibold">{tx.title}</p>
              <p className="mt-0.5 text-xs text-muted">{tx.timestamp}</p>
            </div>
            <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
          </div>

          <Row label="ID Transaksi" value={tx.id} />
          <Row label="Jenis" value={tx.type} />
          <Row
            label="Nominal"
            value={`${tx.amount < 0 ? "- " : "+ "}Rp${Math.abs(tx.amount).toLocaleString("id-ID")}`}
            bold
          />

          {tx.receiptUrl && (
            <a
              href={tx.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-brand"
            >
              <FileText size={16} /> Lihat Digital Receipt
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={bold ? "font-bold text-brand" : "font-medium"}>{value}</span>
    </div>
  )
}
