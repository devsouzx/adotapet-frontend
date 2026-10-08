import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { LocateFixed, MapPin, Pencil, Save } from 'lucide-react'
import { InputField, TextareaField } from '../components/FormField'
import { ErrorState, Modal, Pagination, Spinner } from '../components/Feedback'
import { useToast } from '../contexts/ToastContext'
import { api, ApiRequestError, queryString } from '../services/api'
import type { Page, Shelter } from '../types/api'
import { formatDate } from '../utils/format'

interface ProfileForm { nome: string; email: string; telefone: string; cnpj: string; horarioFuncionamento: string; descricao: string; fotoUrl: string }
interface ProfileUpdate { nome: string; email: string; telefone: string; cnpj: string | null; horarioFuncionamento: string | null; descricao: string | null; fotoUrl: string | null }

export function ShelterProfilePage() {
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { notify } = useToast()
  const load = useCallback(() => {
    setLoading(true); setError('')
    api.get<Shelter>('/abrigo').then(setShelter)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar o perfil.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const submit = async (values: ProfileUpdate) => {
    setBusy(true); setFormError('')
    try {
      const result = await api.put<Shelter>('/abrigo/editar', values)
      setShelter(result); setEditing(false); notify('Perfil do abrigo atualizado.')
    } catch (err) { setFormError(err instanceof ApiRequestError ? err.message : 'Não foi possível atualizar o perfil.') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="content-page"><div className="dashboard-loading"><Spinner label="Carregando perfil..." /></div></div>
  if (error || !shelter) return <div className="content-page"><ErrorState message={error || 'Perfil não encontrado.'} retry={load} /></div>
  return <div className="content-page">
    <section className="page-intro"><div><span className="eyebrow">IDENTIDADE DO SEU ABRIGO</span><h1>Perfil do <em>abrigo.</em></h1><p>Confira e atualize as informações que apresentam seu trabalho.</p></div><button className="button button-primary" onClick={() => { setFormError(''); setEditing(true) }}><Pencil size={16} /> Editar informações</button></section>
    <div className="profile-layout">
      <section className="profile-card">
        <div className="profile-cover" />
        <div className="profile-main">
          <div className="profile-large-avatar">{shelter.fotoUrl ? <img src={shelter.fotoUrl} alt={shelter.nome} /> : shelter.nome.slice(0, 1).toUpperCase()}</div>
          <div className="profile-title"><span className={`profile-status ${shelter.ativo ? '' : 'inactive'}`}><i />{shelter.ativo ? 'Abrigo ativo' : 'Abrigo inativo'}</span><h2>{shelter.nome}</h2><p>{shelter.descricao || 'Ainda não há uma apresentação cadastrada.'}</p></div>
          <div className="profile-info-grid"><div><span>E-mail</span><strong>{shelter.email}</strong></div><div><span>Telefone</span><strong>{shelter.telefone}</strong></div><div><span>CNPJ</span><strong>{shelter.cnpj || 'Não informado'}</strong></div><div><span>Horário</span><strong>{shelter.horarioFuncionamento || 'Não informado'}</strong></div><div><span>No AdotaPet desde</span><strong>{formatDate(shelter.dataCadastro)}</strong></div></div>
        </div>
      </section>
      <aside className="address-card"><span className="address-icon"><MapPin size={19} /></span><span className="eyebrow">LOCALIZAÇÃO</span><h3>Onde nos encontrar</h3>
        <address>{shelter.endereco.logradouro}, {shelter.endereco.numero}<br />{shelter.endereco.bairro}<br />{shelter.endereco.cidade} — {shelter.endereco.estado}<br />CEP {shelter.endereco.cep}</address>
        <div className="profile-info-note">O backend permite atualizar informações do abrigo, mas não oferece endpoint para editar o endereço.</div>
      </aside>
    </div>
    {editing && <ProfileFormModal shelter={shelter} busy={busy} error={formError} onClose={() => setEditing(false)} onSubmit={submit} />}
  </div>
}

function ProfileFormModal({ shelter, busy, error, onClose, onSubmit }: {
  shelter: Shelter; busy: boolean; error: string; onClose: () => void; onSubmit: (values: ProfileUpdate) => Promise<void>
}) {
  const [values, setValues] = useState<ProfileForm>({
    nome: shelter.nome, email: shelter.email, telefone: shelter.telefone, cnpj: shelter.cnpj || '',
    horarioFuncionamento: shelter.horarioFuncionamento || '', descricao: shelter.descricao || '', fotoUrl: shelter.fotoUrl || '',
  })
  const set = (key: keyof ProfileForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((old) => ({ ...old, [key]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit({
    ...values, cnpj: values.cnpj || null, horarioFuncionamento: values.horarioFuncionamento || null,
    descricao: values.descricao || null, fotoUrl: values.fotoUrl || null,
  }) }
  return <Modal title="Editar perfil do abrigo" description="Atualize os dados públicos do seu abrigo." onClose={onClose} wide>
    <form className="modal-form" onSubmit={submit}><div className="form-grid">
      <InputField label="Nome do abrigo" name="nome" maxLength={150} required value={values.nome} onChange={set('nome')} />
      <InputField label="E-mail" name="email" type="email" maxLength={255} required value={values.email} onChange={set('email')} />
      <InputField label="Telefone" name="telefone" maxLength={20} required value={values.telefone} onChange={set('telefone')} />
      <InputField label="CNPJ" name="cnpj" maxLength={14} value={values.cnpj} onChange={set('cnpj')} />
      <InputField label="Horário de funcionamento" name="horarioFuncionamento" maxLength={255} value={values.horarioFuncionamento} onChange={set('horarioFuncionamento')} />
      <InputField label="URL da foto" name="fotoUrl" type="url" value={values.fotoUrl} onChange={set('fotoUrl')} />
    </div><TextareaField label="Apresentação" name="descricao" rows={4} value={values.descricao} onChange={set('descricao')} />
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? <Spinner label="Salvando..." /> : <><Save size={16} /> Salvar perfil</>}</button></div>
    </form>
  </Modal>
}

interface NearbyResult { nome: string; email: string; telefone: string; cnpj: string | null; horarioFuncionamento: string | null; descricao: string | null; fotoUrl: string | null; ativo: boolean; dataCadastro: string; endereco: Shelter['endereco'] }

export function NearbySheltersPage() {
  const [coordinates, setCoordinates] = useState({ latitude: '', longitude: '', raio: '10' })
  const [pageNo, setPageNo] = useState(0)
  const [results, setResults] = useState<Page<NearbyResult> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const locate = () => {
    if (!navigator.geolocation) { setError('Este navegador não oferece localização automática. Informe latitude e longitude.'); return }
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(
      (position) => { setCoordinates((old) => ({ ...old, latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) })); setLocating(false) },
      () => { setError('Não foi possível acessar sua localização. Você pode informar as coordenadas manualmente.'); setLocating(false) },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }
  const search = useCallback((page = pageNo) => {
    if (!coordinates.latitude || !coordinates.longitude) { setError('Informe latitude e longitude para buscar abrigos próximos.'); return }
    setLoading(true); setError('')
    const query = queryString({ latitude: coordinates.latitude, longitude: coordinates.longitude, raio: coordinates.raio || 10, page, size: 10 })
    api.get<Page<NearbyResult>>(`/abrigo/proximos?${query}`).then(setResults)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível buscar abrigos próximos.'))
      .finally(() => setLoading(false))
  }, [coordinates, pageNo])
  const submit = (event: FormEvent) => { event.preventDefault(); setPageNo(0); search(0) }
  const set = (key: keyof typeof coordinates) => (event: ChangeEvent<HTMLInputElement>) => setCoordinates((old) => ({ ...old, [key]: event.target.value }))

  return <div className="content-page">
    <section className="page-intro"><div><span className="eyebrow">PERTO DE VOCÊ</span><h1>Abrigos por <em>perto.</em></h1><p>Encontre abrigos dentro de um raio informado a partir da sua localização.</p></div></section>
    <form className="filter-panel nearby-filter" onSubmit={submit}><div className="filter-heading"><span><MapPin size={17} /> Defina a localização</span><button type="button" className="button button-quiet button-small" onClick={locate} disabled={locating}>{locating ? <Spinner label="Localizando..." /> : <><LocateFixed size={15} /> Usar minha localização</>}</button></div>
      <div className="filter-grid nearby-grid"><InputField label="Latitude" name="latitude" type="number" step="any" min="-90" max="90" required value={coordinates.latitude} onChange={set('latitude')} /><InputField label="Longitude" name="longitude" type="number" step="any" min="-180" max="180" required value={coordinates.longitude} onChange={set('longitude')} /><InputField label="Raio (km)" name="raio" type="number" step="any" min="0.1" required value={coordinates.raio} onChange={set('raio')} /></div>
      {error && <div className="form-alert" role="alert">{error}</div>}<div className="filter-actions"><span className="field-hint">O limite suportado pela API é de 1 a 100 resultados por página.</span><button className="button button-primary button-small" disabled={loading}>{loading ? <Spinner label="Buscando..." /> : <><MapPin size={15} /> Buscar abrigos</>}</button></div>
    </form>
    {results && <section className="nearby-results"><div className="listing-heading"><div><h2>Resultados próximos</h2><p>{results.totalElements} abrigos dentro do raio pesquisado</p></div></div>
      {results.content.length ? <div className="shelter-grid">{results.content.map((shelter, index) => <article className="shelter-card" key={`${shelter.email}-${index}`}>
        <div className="shelter-card-head"><span className="shelter-large-avatar">{shelter.fotoUrl ? <img src={shelter.fotoUrl} alt={shelter.nome} /> : shelter.nome.slice(0, 1).toUpperCase()}</span><span className="profile-status"><i />{shelter.ativo ? 'Ativo' : 'Inativo'}</span></div>
        <h3>{shelter.nome}</h3><p>{shelter.descricao || 'Abrigo participante da rede AdotaPet.'}</p>
        <address><MapPin size={14} />{shelter.endereco.logradouro}, {shelter.endereco.numero}<br />{shelter.endereco.bairro}, {shelter.endereco.cidade} — {shelter.endereco.estado}</address>
        {shelter.telefone && <a className="shelter-contact" href={`tel:${shelter.telefone}`}>{shelter.telefone}</a>}
      </article>)}</div> : <div className="empty-state"><span className="empty-icon"><MapPin size={21} /></span><h3>Nenhum abrigo encontrado</h3><p>Tente aumentar o raio ou ajustar as coordenadas.</p></div>}
      <Pagination data={results} onPage={(next) => { setPageNo(next); search(next) }} />
    </section>}
  </div>
}
