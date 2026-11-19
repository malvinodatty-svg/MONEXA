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

const transferSchema = z.object({
  recipient: z.string().min(3, "Nomor/username penerima wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  note: z.string().optional(),
})

type TransferFormInput = z.input<typeof transferSchema>
type TransferForm = z.output<typeof transferSchema>

type Step = "form" | "confirm" | "success"

export default function TransferPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>("form")
  const [formData, setFormData] = useState<TransferForm | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferForm>({ resolver: zodResolver(transferSchema) })

  const mutation = useMutation({
    mutationFn: (data: TransferForm) => api.post("/wallet/transfer", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      setStep("success")
    },
    onError: () => {
      setErrorMsg("Transfer gagal. Cek kembali saldo atau data penerima.")
      setStep("form")
    },
  })

  function onReview(data: TransferForm) {
    setErrorMsg(null)
    setFormData(data)
    setStep("confirm")
  }

  if (step === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h1 className="text-lg font-bold">Transfer Berhasil</h1>
        <p className="text-sm text-muted">
          Rp{formData?.amount.toLocaleString("id-ID")} terkirim ke {formData?.recipient}
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4 w-full">
          Kembali ke Dashboard
        </Button>
      </div>
    )
  }

  if (step === "confirm" && formData) {
    return (
      <div className="flex min-h-screen flex-col px-6 pt-8">
        <h1 className="mb-6 text-lg font-bold">Konfirmasi Transfer</h1>
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 text-sm">
          <Row label="Penerima" value={formData.recipient} />
          <Row label="Nominal" value={`Rp${formData.amount.toLocaleString("id-ID")}`} bold />
          {formData.note && <Row label="Catatan" value={formData.note} />}
        </div>

        <div className="mt-auto flex flex-col gap-3 pb-8">
          <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
            {mutation.isPending ? "Memproses..." : "Konfirmasi Transfer"}
          </Button>
          <Button variant="outline" onClick={() => setStep("form")}>
            Kembali
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/dashboard">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">Transfer</h1>
      </div>

      <form onSubmit={handleSubmit(onReview)} className="flex flex-1 flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Kirim ke</label>
          <Input placeholder="Username atau no. HP penerima" {...register("recipient")} />
          {errors.recipient && <p className="mt-1 text-xs text-failed">{errors.recipient.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Nominal</label>
          <Input type="number" placeholder="0" {...register("amount")} />
          {errors.amount && <p className="mt-1 text-xs text-failed">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Catatan (opsional)</label>
          <Input placeholder="Bayar makan siang" {...register("note")} />
        </div>

        {errorMsg && <p className="text-xs text-failed">{errorMsg}</p>}

        <Button type="submit" className="mt-auto mb-8">
          Lanjutkan
        </Button>
      </form>
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
