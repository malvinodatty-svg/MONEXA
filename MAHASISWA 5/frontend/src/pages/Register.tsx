import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    role: z.enum(["USER", "MERCHANT"]),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "USER" },
  })

  async function onSubmit(data: RegisterForm) {
    await api.post("/auth/register", data)
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 px-7 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text">Buat Akun</h1>
        <p className="mt-1 text-sm text-muted">Mulai kelola dompet digitalmu</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Nama Lengkap</label>
          <Input placeholder="Nama kamu" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-failed">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Email</label>
          <Input type="email" placeholder="nama@email.com" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-failed">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Kata Sandi</label>
          <Input type="password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-failed">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Konfirmasi Kata Sandi</label>
          <Input type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-failed">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Masuk
        </Link>
      </p>
    </div>
  )
}
