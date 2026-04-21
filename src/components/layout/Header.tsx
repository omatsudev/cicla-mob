import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  userName: string
  unreadNotifications: number
}

export function Header({ userName, unreadNotifications }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 safe-top">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div>
          <span className="text-base font-semibold text-gray-900">
            {userName ? `Olá, ${userName.split(' ')[0]}` : 'Cicla MOB'}
          </span>
        </div>
        <button
          onClick={() => navigate('/notificacoes')}
          className="relative p-2 rounded-full hover:bg-gray-50 transition"
          aria-label="Notificações"
        >
          <Bell size={22} className="text-gray-600" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
