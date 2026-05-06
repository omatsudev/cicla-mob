import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, Calendar, History, User } from 'lucide-react'
import { useProfile } from '@/lib/context/ProfileContext'

const allLinks = [
  { to: '/', label: 'Início', icon: Home, exact: true, manOnly: false },
  { to: '/registrar', label: 'Registrar', icon: PlusCircle, exact: false, manOnly: false, womanOnly: true },
  { to: '/calendario', label: 'Ciclos', icon: Calendar, exact: false, manOnly: false },
  { to: '/historico', label: 'Histórico', icon: History, exact: false, manOnly: false },
  { to: '/perfil', label: 'Perfil', icon: User, exact: false, manOnly: false },
]

export function BottomNav() {
  const { isMan } = useProfile()
  const links = allLinks.filter(l => !(l.womanOnly && isMan))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium transition ${
                isActive ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
