import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Heart, LayoutDashboard, LogOut, Menu, PawPrint, UsersRound, X, ClipboardList, UserRound, MapPinned } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const mainNav = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard, protected: true },
  { to: '/pets', label: 'Pets', icon: PawPrint, protected: false },
  { to: '/adotantes', label: 'Adotantes', icon: UsersRound, protected: true },
  { to: '/adocoes', label: 'Adoções', icon: ClipboardList, protected: true },
  { to: '/abrigos', label: 'Abrigos próximos', icon: MapPinned, protected: false },
]

export function Layout() {
  const { isAuthenticated, name, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const signOut = () => {
    logout()
    setDrawerOpen(false)
    navigate('/')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${drawerOpen ? 'sidebar-open' : ''}`}>
      <Link className="brand" to="/" onClick={() => setDrawerOpen(false)}>
        <span className="brand-mark"><Heart size={19} fill="currentColor" /></span>
        <span>adota<span className="brand-accent">pet</span><small>conexões que mudam vidas</small></span>
      </Link>
      <div className="sidebar-caption">MENU PRINCIPAL</div>
      <nav className="side-nav" aria-label="Navegação principal">
        {mainNav.filter((item) => !item.protected || isAuthenticated).map(({ to, label, icon: Icon }) =>
          <NavLink key={to} to={to} onClick={() => setDrawerOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
            {to === '/pets' && location.pathname === '/' && <span className="nav-dot" />}
          </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="note-icon"><Heart size={17} /></span><strong>Uma nova história começa aqui</strong><span>Pequenos gestos transformam vidas.</span></div>
        {isAuthenticated
          ? <button className="profile-row" onClick={() => navigate('/perfil')}><span className="avatar"><UserRound size={18} /></span><span className="profile-name">{name || 'Abrigo'}<small>Conta do abrigo</small></span><span className="profile-more">•••</span></button>
          : <Link className="profile-row" to="/login"><span className="avatar"><UserRound size={18} /></span><span className="profile-name">Acesso do abrigo<small>Entre para gerenciar</small></span></Link>}
      </div>
    </aside>
    {drawerOpen && <button className="drawer-scrim" aria-label="Fechar menu" onClick={() => setDrawerOpen(false)} />}
    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setDrawerOpen(!drawerOpen)} aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}>
          {drawerOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <div className="breadcrumbs"><span>AdotaPet</span><span className="breadcrumb-slash">/</span><strong>{pageName(location.pathname)}</strong></div>
        <div className="topbar-actions">
          <span className="topbar-tag"><span className="status-dot" /> Plataforma de adoção</span>
          {isAuthenticated
            ? <button className="button button-quiet signout-button" onClick={signOut}><LogOut size={16} /> Sair</button>
            : <Link className="button button-primary button-small" to="/login">Acesso do abrigo</Link>}
        </div>
      </header>
      <div className="page-content" key={location.pathname}><Outlet /></div>
      <footer className="page-footer"><span>AdotaPet · feito para aproximar quem cuida de quem precisa.</span><span>Um lar muda tudo <Heart size={13} fill="currentColor" /></span></footer>
    </main>
  </div>
}

function pageName(path: string): string {
  if (path.startsWith('/pets')) return 'Pets'
  if (path.startsWith('/adotantes')) return 'Adotantes'
  if (path.startsWith('/adocoes')) return 'Adoções'
  if (path.startsWith('/abrigos')) return 'Abrigos próximos'
  if (path.startsWith('/perfil')) return 'Perfil do abrigo'
  if (path.startsWith('/dashboard')) return 'Visão geral'
  if (path.startsWith('/login')) return 'Entrar'
  if (path.startsWith('/cadastro')) return 'Cadastrar abrigo'
  if (path.startsWith('/recuperar-senha')) return 'Recuperar senha'
  return 'Bem-vindo'
}
