import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CalendarDays, Check, ClipboardList, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { InputField, SelectField, TextareaField } from '../components/FormField'
import { EmptyState, ErrorState, Modal, Pagination, Spinner } from '../components/Feedback'
import { useToast } from '../contexts/ToastContext'
import { api, ApiRequestError } from '../services/api'
import type { Adoption, Adopter, Page, Pet } from '../types/api'
import { formatDate } from '../utils/format'

interface AdoptionValues { petId: string; adotanteId: string; dataAdocao: string; observacoes: string }
interface CloseValues { dataEncerramento: string; motivoEncerramento: string }
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function AdoptionsPage() {
  const [pageNo, setPageNo] = useState(0)
  const [data, setData] = useState<Page<Adoption> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<'new' | Adoption | null>(null)
  const [closing, setClosing] = useState<Adoption | null>(null)
  const [deleting, setDeleting] = useState<Adoption | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { notify } = useToast()

  const load = useCallback(() => {
    setLoading(true); setError('')
    api.get<Page<Adoption>>(`/adocao?page=${pageNo}&size=10`)
      .then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar as adoções.'))
      .finally(() => setLoading(false))
  }, [pageNo])
  useEffect(load, [load])

  const save = async (values: AdoptionValues) => {
    setBusy(true); setFormError('')
    const body = { petId: values.petId, adotanteId: values.adotanteId, dataAdocao: values.dataAdocao || null, observacoes: values.observacoes || null }
    try {
      if (form && form !== 'new') {
        await api.put<Adoption>(`/adocao/${form.id}`, { adotanteId: values.adotanteId, dataAdocao: values.dataAdocao, observacoes: values.observacoes || null })
      } else {
        await api.post<Adoption>('/adocao', body)
      }
      const creating = form === 'new'
      setForm(null); notify(creating ? 'Adoção registrada.' : 'Adoção atualizada.')
      if (creating && pageNo > 0) setPageNo(0)
      else load()
    } catch (err) { setFormError(err instanceof ApiRequestError ? err.message : 'Não foi possível salvar a adoção.') }
    finally { setBusy(false) }
  }
  const closeAdoption = async (values: CloseValues) => {
    if (!closing) return
    setBusy(true); setFormError('')
    try {
      await api.patch<Adoption>(`/adocao/${closing.id}/encerrar`, {
        dataEncerramento: values.dataEncerramento || null, motivoEncerramento: values.motivoEncerramento || null,
      })
      setClosing(null); notify('Adoção encerrada.')
      load()
    } catch (err) { setFormError(err instanceof ApiRequestError ? err.message : 'Não foi possível encerrar a adoção.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.delete<void>(`/adocao/${deleting.id}`)
      setDeleting(null); notify('Registro de adoção excluído.')
      if (data?.content.length === 1 && pageNo > 0) setPageNo(pageNo - 1)
      else load()
    } catch (err) { notify(err instanceof Error ? err.message : 'Não foi possível excluir o registro.', 'error') }
    finally { setBusy(false) }
  }

  return <div className="content-page">
    <section className="page-intro">
      <div><span className="eyebrow">ACOMPANHE CADA JORNADA</span><h1>Histórias de <em>adoção.</em></h1><p>Registros de adoção do seu abrigo, do início ao encerramento do acompanhamento.</p></div>
      <button className="button button-primary" onClick={() => { setFormError(''); setForm('new') }}><Plus size={17} /> Registrar adoção</button>
    </section>
    <div className="list-toolbar"><div><span className="toolbar-icon"><ClipboardList size={18} /></span><div><strong>Registros do abrigo</strong><small>{data ? `${data.totalElements} adoções · ordenadas por data` : 'Carregando registros'}</small></div></div>
      <span className="status-legend"><i className="legend-active" /> Ativa <i className="legend-closed" /> Encerrada</span>
    </div>
    {loading ? <div className="table-skeleton">{Array.from({ length: 5 }, (_, i) => <div className="skeleton skeleton-row" key={i} />)}</div>
      : error ? <ErrorState message={error} retry={load} />
        : data?.content.length ? <div className="data-table-wrap"><table className="data-table adoption-table"><thead><tr><th>Pet</th><th>Adotante</th><th>Data da adoção</th><th>Status</th><th className="table-actions-col">Ações</th></tr></thead>
          <tbody>{data.content.map((adoption) => <tr key={adoption.id}>
            <td><div className="table-person"><span className="pet-table-icon">🐾</span><span><strong>{adoption.pet.nome}</strong><small>{adoption.status === 'ENCERRADA' ? `Encerrada em ${formatDate(adoption.dataEncerramento)}` : 'Acompanhamento ativo'}</small></span></div></td>
            <td><div className="table-person"><span className="table-avatar"><span>{adoption.adotante.nome.slice(0, 1).toUpperCase()}</span></span><span><strong>{adoption.adotante.nome}</strong><small>{adoption.adotante.email}</small></span></div></td>
            <td>{formatDate(adoption.dataAdocao)}</td>
            <td><span className={`adoption-status adoption-${adoption.status.toLowerCase()}`}><i />{adoption.status === 'ATIVA' ? 'Ativa' : 'Encerrada'}</span></td>
            <td><div className="table-actions"><button className="icon-button" onClick={() => { setFormError(''); setForm(adoption) }} aria-label={`Editar adoção de ${adoption.pet.nome}`} title="Editar"><Pencil size={16} /></button>
              {adoption.status === 'ATIVA' && <button className="icon-button success-icon" onClick={() => { setFormError(''); setClosing(adoption) }} aria-label={`Encerrar adoção de ${adoption.pet.nome}`} title="Encerrar acompanhamento"><Check size={16} /></button>}
              <button className="icon-button danger-icon" onClick={() => setDeleting(adoption)} aria-label={`Excluir registro de ${adoption.pet.nome}`} title="Excluir"><Trash2 size={16} /></button></div></td>
          </tr>)}</tbody></table></div>
          : <EmptyState title="Nenhuma adoção registrada" description="Quando um pet encontrar uma família, registre a adoção para acompanhar essa jornada." action={<button className="button button-primary button-small" onClick={() => setForm('new')}><Plus size={15} /> Registrar adoção</button>} />}
    {data && <Pagination data={data} onPage={setPageNo} />}
    {form && <AdoptionFormModal adoption={form === 'new' ? null : form} busy={busy} error={formError} onClose={() => setForm(null)} onSubmit={save} />}
    {closing && <CloseFormModal adoption={closing} busy={busy} error={formError} onClose={() => setClosing(null)} onSubmit={closeAdoption} />}
    {deleting && <Modal title="Excluir registro?" description={`Excluir a adoção de ${deleting.pet.nome}? Se ela estiver ativa, o pet voltará ao status disponível conforme as regras do servidor.`} onClose={() => setDeleting(null)}>
      <div className="modal-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button button-danger" disabled={busy} onClick={remove}>{busy ? <Spinner label="Excluindo..." /> : <><Trash2 size={16} /> Excluir registro</>}</button></div>
    </Modal>}
  </div>
}

function AdoptionFormModal({ adoption, busy, error, onClose, onSubmit }: {
  adoption: Adoption | null; busy: boolean; error: string; onClose: () => void; onSubmit: (values: AdoptionValues) => Promise<void>
}) {
  const [pets, setPets] = useState<Pet[]>([])
  const [adopters, setAdopters] = useState<Adopter[]>([])
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState<'pets' | 'adopters' | null>(null)
  const [optionsError, setOptionsError] = useState('')
  const [moreError, setMoreError] = useState('')
  const [petPageNo, setPetPageNo] = useState(0)
  const [adopterPageNo, setAdopterPageNo] = useState(0)
  const [petTotalPages, setPetTotalPages] = useState(0)
  const [adopterTotalPages, setAdopterTotalPages] = useState(0)
  const [petTotalElements, setPetTotalElements] = useState(0)
  const [adopterTotalElements, setAdopterTotalElements] = useState(0)
  const [values, setValues] = useState<AdoptionValues>({
    petId: adoption?.pet.id || '', adotanteId: adoption?.adotante.id || '',
    dataAdocao: adoption?.dataAdocao || today(), observacoes: adoption?.observacoes || '',
  })
  useEffect(() => {
    let active = true
    const petRequest = adoption
      ? Promise.resolve(null)
      : api.get<Page<Pet>>('/pet/filtros?page=0&size=100&status=DISPONIVEL')
    Promise.all([petRequest, api.get<Page<Adopter>>('/adotante?page=0&size=100')])
      .then(([petPage, adopterPage]) => {
      if (active) {
        setPets(petPage?.content || [])
        setPetTotalPages(petPage?.totalPages || 0)
        setPetTotalElements(petPage?.totalElements || 0)
        const people = [...adopterPage.content]
        if (adoption && !people.some((person) => person.id === adoption.adotante.id)) people.unshift(adoption.adotante)
        setAdopters(people)
        setAdopterTotalPages(adopterPage.totalPages)
        setAdopterTotalElements(adopterPage.totalElements)
      }
    }).catch((err: unknown) => { if (active) setOptionsError(err instanceof Error ? err.message : 'Não foi possível carregar pets e adotantes.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [adoption])
  const loadMore = async (kind: 'pets' | 'adopters') => {
    const nextPage = kind === 'pets' ? petPageNo + 1 : adopterPageNo + 1
    setMoreLoading(kind); setMoreError('')
    try {
      if (kind === 'pets') {
        const next = await api.get<Page<Pet>>(`/pet/filtros?page=${nextPage}&size=100&status=DISPONIVEL`)
        setPets((existing) => [...existing, ...next.content.filter((pet) => !existing.some((item) => item.id === pet.id))])
        setPetPageNo(nextPage)
      } else {
        const next = await api.get<Page<Adopter>>(`/adotante?page=${nextPage}&size=100`)
        setAdopters((existing) => [...existing, ...next.content.filter((person) => !existing.some((item) => item.id === person.id))])
        setAdopterPageNo(nextPage)
      }
    } catch (err) {
      setMoreError(err instanceof Error ? err.message : 'Não foi possível carregar mais opções.')
    } finally { setMoreLoading(null) }
  }
  const set = (key: keyof AdoptionValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues((old) => ({ ...old, [key]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit(values) }
  return <Modal title={adoption ? 'Editar adoção' : 'Registrar adoção'} description={adoption ? 'Atualize os dados do registro.' : 'Associe um pet disponível a um adotante.'} onClose={onClose} wide>
    {loading ? <div className="detail-loading"><Spinner label="Carregando opções..." /></div> : <>
      {!adoption && <div className="inline-note">Pets disponíveis: {petTotalElements}. Adotantes: {adopterTotalElements}. As opções podem ser carregadas em páginas; o servidor valida se o pet pertence ao seu abrigo.</div>}
      {optionsError && <div className="form-alert" role="alert">{optionsError}</div>}
      {moreError && <div className="form-alert" role="alert">{moreError}</div>}
      <form className="modal-form" onSubmit={submit}>
        {!adoption && <><SelectField label="Pet disponível" name="petId" required value={values.petId} onChange={set('petId')} options={pets.length ? pets.map((pet) => ({ value: pet.id, label: `${pet.nome} · ${pet.especie} · ${pet.abrigo.nome}` })) : [{ value: '', label: 'Nenhum pet disponível encontrado' }]} disabled={!pets.length || Boolean(optionsError)} />
          {petPageNo + 1 < petTotalPages && <button type="button" className="button button-quiet button-small" disabled={moreLoading !== null} onClick={() => void loadMore('pets')}>{moreLoading === 'pets' ? <Spinner label="Carregando pets..." /> : 'Carregar mais pets'}</button>}</>}
        <SelectField label="Adotante" name="adotanteId" required value={values.adotanteId} onChange={set('adotanteId')} options={adopters.length ? adopters.map((person) => ({ value: person.id, label: `${person.nome} · ${person.email}` })) : [{ value: '', label: 'Nenhum adotante cadastrado' }]} disabled={!adopters.length || Boolean(optionsError)} />
        {adopterPageNo + 1 < adopterTotalPages && <button type="button" className="button button-quiet button-small" disabled={moreLoading !== null} onClick={() => void loadMore('adopters')}>{moreLoading === 'adopters' ? <Spinner label="Carregando adotantes..." /> : 'Carregar mais adotantes'}</button>}
        <InputField label="Data da adoção" name="dataAdocao" type="date" required max={today()} value={values.dataAdocao} onChange={set('dataAdocao')} />
        <TextareaField label="Observações" name="observacoes" rows={3} value={values.observacoes} onChange={set('observacoes')} />
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy || moreLoading !== null || Boolean(optionsError) || (!adoption && (!pets.length || !adopters.length))}>{busy ? <Spinner label="Salvando..." /> : adoption ? 'Salvar alterações' : 'Registrar adoção'}</button></div>
      </form>
    </>}
  </Modal>
}

function CloseFormModal({ adoption, busy, error, onClose, onSubmit }: {
  adoption: Adoption; busy: boolean; error: string; onClose: () => void; onSubmit: (values: CloseValues) => Promise<void>
}) {
  const [values, setValues] = useState<CloseValues>({ dataEncerramento: today(), motivoEncerramento: '' })
  const set = (key: keyof CloseValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((old) => ({ ...old, [key]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit(values) }
  return <Modal title="Encerrar acompanhamento" description={`Informe o encerramento da adoção de ${adoption.pet.nome}.`} onClose={onClose}>
    <form className="modal-form" onSubmit={submit}>
      <div className="inline-note"><CalendarDays size={16} /> A data deve estar entre {formatDate(adoption.dataAdocao)} e hoje.</div>
      <InputField label="Data de encerramento" name="dataEncerramento" type="date" min={adoption.dataAdocao} max={today()} required value={values.dataEncerramento} onChange={set('dataEncerramento')} />
      <TextareaField label="Motivo do encerramento" name="motivoEncerramento" rows={3} value={values.motivoEncerramento} onChange={set('motivoEncerramento')} />
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Voltar</button><button className="button button-primary" disabled={busy}>{busy ? <Spinner label="Encerrando..." /> : <><RotateCcw size={15} /> Encerrar adoção</>}</button></div>
    </form>
  </Modal>
}
