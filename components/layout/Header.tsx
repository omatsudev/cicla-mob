import { LogOut } from 'lucide-react'

interface HeaderProps {
  userName?: string
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-rose-100">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="font-bold text-rose-700 text-sm">Cicla MOB</span>
        </div>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-xs text-gray-500 hidden sm:block">{userName}</span>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 transition py-1.5 px-2 rounded-lg hover:bg-rose-50"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
