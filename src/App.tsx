import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from './components/Layout'
import { useAuth } from './contexts/AuthContext'
import { AdoptionsPage } from './pages/AdoptionsPage'
import { AdoptersPage } from './pages/AdoptersPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage, RegisterPage, RequestResetPage, ResetPasswordPage } from './pages/AuthPages'
import { PetsPage } from './pages/PetsPage'
import { NearbySheltersPage, ShelterProfilePage } from './pages/ShelterPages'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function NotFound() {
  return <div className="not-found"><span className="eyebrow">PÁGINA NÃO ENCONTRADA</span><h1>Este caminho não existe.</h1><p>Volte ao início para continuar explorando.</p><Link className="button button-primary" to="/">Ir para o início</Link></div>
}

export function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="pets" element={<PetsPage />} />
      <Route path="adotantes" element={<RequireAuth><AdoptersPage /></RequireAuth>} />
      <Route path="abrigos" element={<NearbySheltersPage />} />
      <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="adocoes" element={<RequireAuth><AdoptionsPage /></RequireAuth>} />
      <Route path="perfil" element={<RequireAuth><ShelterProfilePage /></RequireAuth>} />
      <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="cadastro" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="recuperar-senha" element={<GuestOnly><RequestResetPage /></GuestOnly>} />
      <Route path="resetar-senha" element={<ResetPasswordPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
}
