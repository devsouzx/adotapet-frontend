import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, PawPrint, Plus, Sparkles, UsersRound } from 'lucide-react'
import { ErrorState, Spinner } from '../components/Feedback'
import { api } from '../services/api'
import type { Adoption, Page, Pet } from '../types/api'
import { formatDate } from '../utils/format'

export function DashboardPage() {
  const [pets, setPets] = useState<Page<Pet> | null>(null)
  const [adoptions, setAdoptions] = useState<Page<Adoption> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => {
    setLoading(true); setError('')
    Promise.all([
      api.get<Page<Pet>>('/pet/filtros?page=0&size=1&status=DISPONIVEL'),
      api.get<Page<Adoption>>('/adocao?page=0&size=5'),
    ]).then(([petPage, adoptionPage]) => { setPets(petPage); setAdoptions(adoptionPage) })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar a visão geral.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  return <div className="dashboard-page">
    <section className="dashboard-welcome">
      <div><span className="eyebrow"><Sparkles size={14} /> VISÃO GERAL DO SEU ABRIGO</span><h1>Olá, que bom ter você <em>por aqui.</em></h1><p>Acompanhe os pets e as histórias de adoção registradas pelo seu abrigo.</p></div>
      <div className="welcome-paw" aria-hidden="true">🐾</div>
    </section>
    {error ? <ErrorState message={error} retry={load} /> : loading ? <div className="dashboard-loading"><Spinner label="Carregando seus dados..." /></div> : <>
      <div className="metric-grid">
        <article className="metric-card metric-green"><div className="metric-icon"><PawPrint size={20} /></div><span className="metric-label">Pets disponíveis na plataforma</span><strong>{pets?.totalElements ?? 0}</strong><small>Resultado da busca pública</small><Link to="/pets">Ver pets <ArrowRight size={14} /></Link></article>
        <article className="metric-card metric-coral"><div className="metric-icon"><ClipboardList size={20} /></div><span className="metric-label">Adoções do seu abrigo</span><strong>{adoptions?.totalElements ?? 0}</strong><small>Todos os registros cadastrados</small><Link to="/adocoes">Acompanhar adoções <ArrowRight size={14} /></Link></article>
        <article className="metric-card metric-lilac"><div className="metric-icon"><UsersRound size={20} /></div><span className="metric-label">Gerencie adotantes</span><strong><span className="metric-action-label">Organize seus contatos</span></strong><small>Cadastros e contatos de adoção</small><Link to="/adotantes">Ver adotantes <ArrowRight size={14} /></Link></article>
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel recent-panel">
          <div className="panel-heading"><div><h2>Movimentações recentes</h2><p>Últimas adoções registradas pelo seu abrigo</p></div><Link className="text-link" to="/adocoes">Ver todas <ArrowRight size={14} /></Link></div>
          {adoptions?.content.length
            ? <div className="recent-list">{adoptions.content.slice(0, 5).map((adoption) => <article className="recent-row" key={adoption.id}>
                <span className={`recent-icon ${adoption.status === 'ATIVA' ? 'recent-active' : ''}`}><PawPrint size={17} /></span>
                <span className="recent-main"><strong>{adoption.pet.nome} <span>·</span> {adoption.adotante.nome}</strong><small><CalendarDays size={13} /> {formatDate(adoption.dataAdocao)}</small></span>
                <span className={`adoption-status adoption-${adoption.status.toLowerCase()}`}><i />{adoption.status === 'ATIVA' ? 'Ativa' : 'Encerrada'}</span>
              </article>)}</div>
            : <div className="panel-empty"><span className="empty-icon"><ClipboardList size={20} /></span><strong>Suas histórias começam aqui</strong><p>Quando registrar uma adoção, ela aparecerá neste espaço.</p></div>}
        </section>
        <aside className="dashboard-panel shortcuts-panel">
          <div className="panel-heading"><div><h2>Acesso rápido</h2><p>O que você quer fazer agora?</p></div></div>
          <Link className="shortcut-row" to="/pets"><span className="shortcut-icon shortcut-green"><PawPrint size={17} /></span><span><strong>Cadastrar um pet</strong><small>Apresente seu próximo amigo</small></span><Plus size={16} /></Link>
          <Link className="shortcut-row" to="/adotantes"><span className="shortcut-icon shortcut-coral"><UsersRound size={17} /></span><span><strong>Novo adotante</strong><small>Organize os contatos</small></span><Plus size={16} /></Link>
          <Link className="shortcut-row" to="/adocoes"><span className="shortcut-icon shortcut-lilac"><ClipboardList size={17} /></span><span><strong>Registrar adoção</strong><small>Inicie um acompanhamento</small></span><Plus size={16} /></Link>
          <Link className="shortcut-profile" to="/perfil">Atualizar perfil do abrigo <ArrowRight size={15} /></Link>
        </aside>
      </div>
      <div className="dashboard-footnote">Os indicadores refletem os dados fornecidos pela API: pets disponíveis globalmente e adoções registradas para o abrigo autenticado. <Link to="/pets">Conheça os pets</Link></div>
    </>}
  </div>
}
