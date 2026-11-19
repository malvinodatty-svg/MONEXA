import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api/client"
import { saveSession } from "@/lib/auth"
import { USE_MOCK, delay } from "@/lib/mock/data"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setServerError(null)

    if (USE_MOCK) {
      // Mode demo: langsung masuk tanpa memanggil backend asli.
      await delay(null, 400)
      saveSession("mock-token", "USER")
      navigate("/dashboard")
      return
    }

    try {
      // Sesuaikan dengan kontrak API M2, mis. { token, role }
      const res = await api.post("/auth/login", data)
      saveSession(res.data.token, res.data.role)
      navigate("/dashboard")
    } catch (err) {
      setServerError("Email atau kata sandi salah.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 px-7 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand">Monexa</h1>
        <p className="mt-1 text-sm text-muted">Dompet digital yang aman &amp; simpel</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-text">Email</label>
          <Input type="email" placeholder="nama@email.com" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-failed">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-text">Kata Sandi</label>
          <Input type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-failed">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-xs text-failed">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link to="/register" className="font-semibold text-brand">
          Daftar
        </Link>
      </p>
    </div>
  )
}
