import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"

const topUpSchema = z.object({
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  method: z.string().min(1, "Pilih metode top-up"),
})
type TopUpFormInput = z.input<typeof topUpSchema>
type TopUpForm = z.output<typeof topUpSchema>

const methods = ["Transfer Bank", "Kartu Debit", "QRIS"]

export default function TopUpPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState<TopUpForm | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopUpFormInput, unknown, TopUpForm>({ resolver: zodResolver(topUpSchema) })

  const mutation = useMutation({
    mutationFn: (data: TopUpForm) => api.post("/wallet/topup", data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      setSuccess(variables)
    },
  })

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h1 className="text-lg font-bold">Top Up Berhasil</h1>
        <p className="text-sm text-muted">Rp{success.amount.toLocaleString("id-ID")} masuk ke wallet-mu</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4 w-full">
          Kembali ke Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/dashboard"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Top Up</h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-1 flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Nominal</label>
          <Input type="number" placeholder="0" {...register("amount")} />
          {errors.amount && <p className="mt-1 text-xs text-failed">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Metode</label>
          <div className="flex flex-col gap-2">
            {methods.map((m) => (
              <label key={m} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <input type="radio" value={m} {...register("method")} />
                <span className="text-sm">{m}</span>
              </label>
            ))}
          </div>
          {errors.method && <p className="mt-1 text-xs text-failed">{errors.method.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="mt-auto mb-8">
          {mutation.isPending ? "Memproses..." : "Top Up Sekarang"}
        </Button>
      </form>
    </div>
  )
}
