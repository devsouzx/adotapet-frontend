import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ArrowRight, Filter, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { InputField, SelectField, TextareaField } from '../components/FormField'
import { EmptyState, ErrorState, Modal, Pagination, SkeletonCards, Spinner } from '../components/Feedback'
import { PetCard } from '../components/PetCard'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { api, ApiRequestError, queryString } from '../services/api'
import type { Page, Pet, PetSex, PetSize, PetStatus } from '../types/api'
import { ageLabel, petStatusLabel } from '../utils/format'

interface Filters { nome: string; especie: string; raca: string; idadeEstimadaMeses: string; peso: string; status: string; sexo: string; porte: string }
const defaults: Filters = { nome: '', especie: '', raca: '', idadeEstimadaMeses: '', peso: '', status: 'DISPONIVEL', sexo: '', porte: '' }
interface PetFormValues {
  nome: string; especie: string; raca: string; descricao: string; idadeEstimadaMeses: string
  peso: string; fotoUrl: string; status: PetStatus; sexo: PetSex; porte: PetSize
}
const emptyPet: PetFormValues = { nome: '', especie: '', raca: '', descricao: '', idadeEstimadaMeses: '', peso: '', fotoUrl: '', status: 'DISPONIVEL', sexo: 'FEMEA', porte: 'MEDIO' }

export function PetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Math.max(0, Number(searchParams.get('page') || 0))
  const [page, setPage] = useState<Page<Pet> | null>(null)
  const [filters, setFilters] = useState<Filters>(defaults)
  const [applied, setApplied] = useState<Filters>(defaults)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<Pet | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Pet | null>(null)
  const [deleting, setDeleting] = useState<Pet | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { isAuthenticated } = useAuth()
  const { notify } = useToast()

  const load = useCallback(() => {
    setLoading(true); setError('')
    const query = queryString({
      nome: applied.nome ? `%${applied.nome.trim()}%` : undefined,
      especie: applied.especie.trim() ? `%${applied.especie.trim()}%` : undefined,
      raca: applied.raca.trim() ? `%${applied.raca.trim()}%` : undefined,
      idadeEstimadaMeses: applied.idadeEstimadaMeses || undefined,
      peso: applied.peso || undefined,
      status: applied.status || undefined, sexo: applied.sexo || undefined, porte: applied.porte || undefined,
      page: currentPage, size: 9,
    })
    api.get<Page<Pet>>(`/pet/filtros?${query}`)
      .then(setPage)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar os pets.'))
      .finally(() => setLoading(false))
  }, [applied, currentPage])

  useEffect(load, [load])

  const updatePage = (next: number) => {
    setSearchParams(next > 0 ? { page: String(next) } : {})
  }
  const applyFilters = (event: FormEvent) => {
    event.preventDefault()
    setApplied(filters)
    updatePage(0)
  }
  const resetFilters = () => { setFilters(defaults); setApplied(defaults); updatePage(0) }
  const openPet = async (pet: Pet) => {
    setFormError('')
    setDetailLoading(true)
    setDetail(pet)
    try { setDetail(await api.get<Pet>(`/pet/${pet.id}`)) }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Não foi possível carregar os detalhes.') }
    finally { setDetailLoading(false) }
  }
  const openForm = (pet?: Pet) => {
    setEditing(pet || null)
    setFormError('')
    setFormOpen(true)
  }
  const deletePet = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.delete<void>(`/pet/${deleting.id}/remover`)
      setDeleting(null); setDetail(null); notify('Pet removido.')
      if (page?.content.length === 1 && currentPage > 0) updatePage(currentPage - 1)
      else load()
    } catch (err) { notify(err instanceof Error ? err.message : 'Não foi possível remover o pet.', 'error') }
    finally { setBusy(false) }
  }
  const pets = page?.content || []

  return <div className="content-page">
    <section className="page-intro">
      <div><span className="eyebrow">ENCONTRE UMA NOVA AMIZADE</span><h1>Pets para <em>adotar.</em></h1><p>Conheça os pets cadastrados pelos abrigos e descubra quem está esperando por você.</p></div>
      {isAuthenticated && <button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Cadastrar pet</button>}
    </section>
    <form className="filter-panel" onSubmit={applyFilters}>
      <div className="filter-heading"><span><SlidersHorizontal size={17} /> Encontre seu pet</span><span className="filter-hint">Filtros disponíveis na API</span></div>
      <div className="filter-grid">
        <InputField label="Nome" name="nome" placeholder="Ex.: Luna" value={filters.nome} onChange={(e) => setFilters({ ...filters, nome: e.target.value })} />
        <InputField label="Espécie" name="especie" placeholder="Ex.: Gato" value={filters.especie} onChange={(e) => setFilters({ ...filters, especie: e.target.value })} />
        <InputField label="Raça" name="raca" placeholder="Ex.: SRD" value={filters.raca} onChange={(e) => setFilters({ ...filters, raca: e.target.value })} />
        <InputField label="Idade (meses)" name="idadeEstimadaMeses" type="number" min="0" step="1" value={filters.idadeEstimadaMeses} onChange={(e) => setFilters({ ...filters, idadeEstimadaMeses: e.target.value })} />
        <InputField label="Peso (kg)" name="peso" type="number" min="0" step="0.01" value={filters.peso} onChange={(e) => setFilters({ ...filters, peso: e.target.value })} />
        <SelectField label="Status" name="status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={[
          { value: '', label: 'Todos os status' }, { value: 'DISPONIVEL', label: 'Disponível' }, { value: 'ADOTADO', label: 'Adotado' }, { value: 'INDISPONIVEL', label: 'Indisponível' },
        ]} />
        <SelectField label="Sexo" name="sexo" value={filters.sexo} onChange={(e) => setFilters({ ...filters, sexo: e.target.value })} options={[
          { value: '', label: 'Todos' }, { value: 'FEMEA', label: 'Fêmea' }, { value: 'MACHO', label: 'Macho' },
        ]} />
        <SelectField label="Porte" name="porte" value={filters.porte} onChange={(e) => setFilters({ ...filters, porte: e.target.value })} options={[
          { value: '', label: 'Todos' }, { value: 'PEQUENO', label: 'Pequeno' }, { value: 'MEDIO', label: 'Médio' }, { value: 'GRANDE', label: 'Grande' },
        ]} />
      </div>
      <div className="filter-actions"><button type="button" className="button button-quiet button-small" onClick={resetFilters}><X size={15} /> Limpar filtros</button><button className="button button-primary button-small"><Filter size={15} /> Aplicar filtros</button></div>
    </form>
    <div className="listing-heading"><div><h2>{applied.status === 'DISPONIVEL' ? 'Esperando por uma família' : 'Pets cadastrados'}</h2>
      <p>{page ? `${page.totalElements} ${page.totalElements === 1 ? 'pet encontrado' : 'pets encontrados'}` : 'Pets de abrigos cadastrados na plataforma'}</p></div>
      <span className="listing-note"><Search size={15} /> Busca por filtros</span>
    </div>
    {loading ? <SkeletonCards count={6} /> : error ? <ErrorState message={error} retry={load} /> : pets.length
      ? <div className="pet-grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} onOpen={openPet} />)}</div>
      : <EmptyState title="Nenhum pet encontrado" description="Tente ajustar os filtros ou volte mais tarde para conhecer novos pets." action={<button className="button button-secondary button-small" onClick={resetFilters}>Limpar filtros</button>} />}
    {page && <Pagination data={page} onPage={updatePage} />}
    {detail && <PetDetailModal pet={detail} loading={detailLoading} onClose={() => { setDetail(null); setFormError('') }}
      onEdit={() => { setDetail(null); openForm(detail) }} onDelete={() => { setDetail(null); setDeleting(detail) }}
      editable={isAuthenticated} error={formError} />}
    {formOpen && <PetFormModal pet={editing} busy={busy} error={formError} onClose={() => setFormOpen(false)} onSubmit={async (values) => {
      setBusy(true); setFormError('')
      try {
        const body = {
          ...values, idadeEstimadaMeses: values.idadeEstimadaMeses === '' ? null : Number(values.idadeEstimadaMeses),
          peso: values.peso === '' ? null : Number(values.peso),
        }
        if (editing) await api.put<Pet>(`/pet/${editing.id}/editar`, body)
        else await api.post<Pet>('/pet/novo', body)
        setFormOpen(false); notify(editing ? 'Pet atualizado.' : 'Pet cadastrado.')
        load()
      } catch (err) { setFormError(err instanceof ApiRequestError ? err.message : 'Não foi possível salvar o pet.') }
      finally { setBusy(false) }
    }} />}
    {deleting && <Modal title="Remover pet?" description={`Você está prestes a remover ${deleting.nome}. Esta ação não pode ser desfeita.`} onClose={() => setDeleting(null)}>
      <div className="modal-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button button-danger" disabled={busy} onClick={deletePet}>{busy ? <Spinner label="Removendo..." /> : <><Trash2 size={16} /> Remover pet</>}</button></div>
    </Modal>}
  </div>
}

function PetFormModal({ pet, busy, error, onClose, onSubmit }: {
  pet: Pet | null; busy: boolean; error: string; onClose: () => void; onSubmit: (values: PetFormValues) => Promise<void>
}) {
  const initial = useMemo(() => pet ? {
    nome: pet.nome, especie: pet.especie, raca: pet.raca, descricao: pet.descricao || '',
    idadeEstimadaMeses: pet.idadeEstimadaMeses?.toString() || '', peso: pet.peso?.toString() || '',
    fotoUrl: pet.fotoUrl || '', status: pet.status, sexo: pet.sexo, porte: pet.porte,
  } : emptyPet, [pet])
  const [values, setValues] = useState<PetFormValues>(initial)
  const set = (key: keyof PetFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((old) => ({ ...old, [key]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit(values) }
  return <Modal title={pet ? `Editar ${pet.nome}` : 'Cadastrar pet'} description="Preencha os dados do pet. Os campos com * são obrigatórios." onClose={onClose} wide>
    <form className="modal-form" onSubmit={submit}>
      <div className="form-grid">
        <InputField label="Nome" name="nome" maxLength={100} required value={values.nome} onChange={set('nome')} />
        <InputField label="Espécie" name="especie" maxLength={50} required placeholder="Ex.: Cachorro, Gato" value={values.especie} onChange={set('especie')} />
        <InputField label="Raça" name="raca" maxLength={100} required value={values.raca} onChange={set('raca')} />
        <InputField label="Idade estimada (meses)" name="idadeEstimadaMeses" type="number" min="0" step="1" value={values.idadeEstimadaMeses} onChange={set('idadeEstimadaMeses')} />
        <InputField label="Peso (kg)" name="peso" type="number" min="0" step="0.01" value={values.peso} onChange={set('peso')} />
        <SelectField label="Status" name="status" required value={values.status} onChange={set('status')} options={[
          { value: 'DISPONIVEL', label: 'Disponível' }, { value: 'ADOTADO', label: 'Adotado' }, { value: 'INDISPONIVEL', label: 'Indisponível' },
        ]} />
        <SelectField label="Sexo" name="sexo" required value={values.sexo} onChange={set('sexo')} options={[
          { value: 'FEMEA', label: 'Fêmea' }, { value: 'MACHO', label: 'Macho' },
        ]} />
        <SelectField label="Porte" name="porte" required value={values.porte} onChange={set('porte')} options={[
          { value: 'PEQUENO', label: 'Pequeno' }, { value: 'MEDIO', label: 'Médio' }, { value: 'GRANDE', label: 'Grande' },
        ]} />
      </div>
      <InputField label="URL da foto" name="fotoUrl" type="url" placeholder="https://" value={values.fotoUrl} onChange={set('fotoUrl')} />
      <TextareaField label="Descrição" name="descricao" rows={4} value={values.descricao} onChange={set('descricao')} />
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button>
        <button className="button button-primary" disabled={busy}>{busy ? <Spinner label="Salvando..." /> : pet ? 'Salvar alterações' : 'Cadastrar pet'}</button></div>
    </form>
  </Modal>
}

function PetDetailModal({ pet, loading, editable, onClose, onEdit, onDelete, error }: {
  pet: Pet; loading: boolean; editable: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void; error: string
}) {
  return <Modal title={pet.nome} description={`${pet.especie} · ${pet.raca}`} onClose={onClose} wide>
    {loading ? <div className="detail-loading"><Spinner label="Carregando informações..." /></div> : <>
      <div className="pet-detail">
        {pet.fotoUrl ? <img className="pet-detail-image" src={pet.fotoUrl} alt={pet.nome} /> : <div className="pet-detail-placeholder"><span>🐾</span></div>}
        <div className="pet-detail-content"><span className={`pet-status status-${pet.status.toLowerCase()}`}>{petStatusLabel(pet.status)}</span>
          <p>{pet.descricao || 'Este pet está esperando por uma família que queira compartilhar muito carinho.'}</p>
          <dl className="detail-list"><div><dt>Idade estimada</dt><dd>{ageLabel(pet.idadeEstimadaMeses)}</dd></div><div><dt>Peso</dt><dd>{pet.peso ? `${pet.peso} kg` : 'Não informado'}</dd></div><div><dt>Sexo</dt><dd>{pet.sexo === 'FEMEA' ? 'Fêmea' : 'Macho'}</dd></div><div><dt>Porte</dt><dd>{pet.porte}</dd></div><div><dt>Abrigo</dt><dd>{pet.abrigo.nome}</dd></div></dl>
          {error && <div className="form-alert" role="alert">{error}</div>}
        </div>
      </div>
      {editable && <div className="modal-actions detail-actions"><button className="button button-danger button-outline" onClick={onDelete}><Trash2 size={15} /> Remover</button><button className="button button-primary" onClick={onEdit}>Editar pet <ArrowRight size={15} /></button></div>}
    </>}
  </Modal>
}
