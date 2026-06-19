import { NavLink, useNavigate } from 'react-router-dom'
import { Map, List, LogOut, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Layout({ children, wsConnected }) {
  const navigate = useNavigate()

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 flex flex-col border-r border-border" style={{ background: 'hsl(222 47% 10%)' }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Bike className="text-primary" size={22} />
          <span className="font-bold text-primary text-lg">Bikeshare</span>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <Map size={16} />
            Mapa
          </NavLink>

          <NavLink
            to="/bikes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <List size={16} />
            Bikes
          </NavLink>
        </nav>

        <div className="p-3 border-t border-border">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-2 w-fit ${wsConnected ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
            {wsConnected ? 'Tempo real' : 'Desconectado'}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-red-400" onClick={logout}>
            <LogOut size={14} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
