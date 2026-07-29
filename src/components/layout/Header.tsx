import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 safe-top">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900">
          {userName ? `Olá, ${userName.split(' ')[0]}` : 'Cicla MOB'}
        </span>
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-full hover:bg-gray-50 transition"
          aria-label="Notificações"
        >
          <Bell size={22} className="text-gray-600" />
        </button>
      </div>
    </header>
  )
}
