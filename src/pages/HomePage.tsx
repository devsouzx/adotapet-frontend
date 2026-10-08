import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, PawPrint, Search, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import type { Page, Pet } from '../types/api'
import { PetCard } from '../components/PetCard'
import { EmptyState, ErrorState, SkeletonCards } from '../components/Feedback'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [availableCount, setAvailableCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Pet | null>(null)
  const { isAuthenticated } = useAuth()

  const load = () => {
    setLoading(true); setError('')
    api.get<Page<Pet>>('/pet/filtros?page=0&size=4&status=DISPONIVEL')
      .then((page) => { setPets(page.content); setAvailableCount(page.totalElements) })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar os pets.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  return <div className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={14} /> ADOÇÃO RESPONSÁVEL, CONEXÕES REAIS</span>
        <h1>Tem um amor<br />esperando por <em>você.</em></h1>
        <p>Conheça pets que estão prontos para encontrar uma família. O próximo capítulo da história deles pode começar com você.</p>
        <div className="hero-actions"><Link to="/pets" className="button button-primary">Encontrar meu pet <ArrowRight size={17} /></Link>
          {isAuthenticated ? <Link to="/dashboard" className="button button-secondary">Painel do abrigo</Link> : <Link to="/cadastro" className="button button-secondary">Sou um abrigo</Link>}
        </div>
        <div className="hero-trust"><span className="trust-avatars"><i>🐶</i><i>🐱</i><i>🐾</i></span><span>Adotar transforma duas vidas: a deles e a sua.</span></div>
      </div>
      <div className="hero-art">
        <div className="hero-art-bg" />
        <div className="hero-photo hero-photo-main"><img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85" alt="Cachorro feliz esperando uma família" /></div>
        <div className="hero-photo hero-photo-small"><img src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=85" alt="Gato curioso" /></div>
        <div className="hero-float-note"><span className="float-heart"><Heart size={16} fill="currentColor" /></span><span><strong>Um novo começo</strong><small>começa com carinho</small></span></div>
        <span className="hero-sparkle sparkle-a">✳</span><span className="hero-sparkle sparkle-b">✳</span>
      </div>
      <div className="hero-bottom"><span>Histórias de cuidado, de ponta a ponta.</span><span className="hero-bottom-count">{availableCount !== null ? `${availableCount} pets disponíveis agora` : 'Descubra seu próximo melhor amigo'} <PawPrint size={15} /></span></div>
    </section>
    <section className="featured-section">
      <div className="section-heading">
        <div><span className="eyebrow">ENCONTRE SEU COMPANHEIRO</span><h2>Amigos à sua espera<span className="heading-period">.</span></h2><p>Cada um tem uma personalidade única. Qual combina com você?</p></div>
        <Link className="button button-secondary" to="/pets"><Search size={16} /> Ver todos os pets <ArrowRight size={15} /></Link>
      </div>
      {loading ? <SkeletonCards count={4} /> : error ? <ErrorState message={error} retry={load} /> : pets.length
        ? <div className="pet-grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} onOpen={setSelected} />)}</div>
        : <EmptyState title="Novos amigos estão chegando" description="No momento não há pets disponíveis para adoção. Volte em breve para conhecer novas histórias." />}
      {selected && <PetQuickView pet={selected} onClose={() => setSelected(null)} />}
    </section>
    <section className="care-banner">
      <div className="care-banner-icon"><Heart size={22} fill="currentColor" /></div>
      <div><span className="eyebrow">PARA QUEM FAZ A DIFERENÇA</span><h2>Seu abrigo cuida. A gente ajuda a conectar.</h2><p>Apresente seus pets, organize os adotantes e acompanhe cada jornada em um só lugar.</p></div>
      <Link className="button button-light" to={isAuthenticated ? '/dashboard' : '/cadastro'}>{isAuthenticated ? 'Acessar painel' : 'Conhecer a plataforma'} <ArrowRight size={16} /></Link>
    </section>
  </div>
}

function PetQuickView({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [onClose])
  return <div className="quick-view-backdrop" onClick={onClose}><section className="quick-view" role="dialog" aria-modal="true" aria-label={`Detalhes de ${pet.nome}`} onClick={(e) => e.stopPropagation()}>
    <button ref={closeRef} className="quick-close icon-button" onClick={onClose} aria-label="Fechar detalhes">×</button>
    {pet.fotoUrl && <img className="quick-image" src={pet.fotoUrl} alt={pet.nome} />}
    <div className="quick-content"><span className="eyebrow">CONHEÇA SEU NOVO AMIGO</span><h2>{pet.nome}</h2><p>{pet.descricao || `${pet.nome} está esperando por uma família para chamar de sua.`}</p>
      <div className="quick-meta"><span>{pet.especie} · {pet.raca}</span><span>{pet.abrigo.nome}</span></div><Link className="button button-primary button-full" to="/pets">Ver pets disponíveis <ArrowRight size={16} /></Link></div>
  </section></div>
}
