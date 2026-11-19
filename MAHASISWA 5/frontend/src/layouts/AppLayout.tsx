import { Outlet, NavLink } from "react-router-dom"
import { Home, ArrowLeftRight, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { to: "/history", label: "Riwayat", icon: History },
  { to: "/profile", label: "Profil", icon: User },
]

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 mx-auto flex w-full max-w-md items-center justify-around border-t border-border bg-surface py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium text-muted",
                isActive && "text-brand"
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
