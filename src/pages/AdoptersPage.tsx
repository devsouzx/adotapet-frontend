import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Mail, Pencil, Phone, Plus, Trash2, UserRound, UsersRound } from 'lucide-react'
import { InputField } from '../components/FormField'
import { EmptyState, ErrorState, Modal, Pagination, Spinner } from '../components/Feedback'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { api, ApiRequestError } from '../services/api'
import type { Adopter, Page } from '../types/api'
import { formatDate } from '../utils/format'

interface AdopterForm { nome: string; email: string; telefone: string; dataNascimento: string }
const empty: AdopterForm = { nome: '', email: '', telefone: '', dataNascimento: '' }

export function AdoptersPage() {
  const [data, setData] = useState<Page<Adopter> | null>(null)
  const [pageNo, setPageNo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Adopter | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Adopter | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const { isAuthenticated } = useAuth()
  const { notify } = useToast()

  const load = useCallback(() => {
    setLoading(true); setError('')
    api.get<Page<Adopter>>(`/adotante?page=${pageNo}&size=10`)
      .then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar os adotantes.'))
      .finally(() => setLoading(false))
  }, [pageNo])
  useEffect(load, [load])

  const openForm = (adopter?: Adopter) => { setFormError(''); setEditing(adopter || null) }
  const submit = async (values: AdopterForm) => {
    setBusy(true); setFormError('')
    const body = { nome: values.nome, email: values.email, telefone: values.telefone, dataNascimento: values.dataNascimento || null }
    try {
      if (editing) await api.put<Adopter>(`/adotante/${editing.id}`, body)
      else await api.post<Adopter>('/adotante/novo', body)
      setEditing(undefined); notify(editing ? 'Dados do adotante atualizados.' : 'Adotante cadastrado.')
      load()
    } catch (err) { setFormError(err instanceof ApiRequestError ? err.message : 'Não foi possível salvar o adotante.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.delete<void>(`/adotante/${deleting.id}`)
      setDeleting(null); notify('Adotante removido.')
      if (data?.content.length === 1 && pageNo > 0) setPageNo(pageNo - 1)
      else load()
    } catch (err) { notify(err instanceof Error ? err.message : 'Não foi possível remover o adotante.', 'error') }
    finally { setBusy(false) }
  }

  return <div className="content-page">
    <section className="page-intro">
      <div><span className="eyebrow">REDE DE CUIDADO</span><h1>Adotantes com <em>histórias.</em></h1><p>Consulte e gerencie os contatos cadastrados para acompanhar cada processo de adoção.</p></div>
      {isAuthenticated && <button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Novo adotante</button>}
    </section>
    <div className="list-toolbar"><div><span className="toolbar-icon"><UsersRound size={18} /></span><div><strong>Adotantes cadastrados</strong><small>{data ? `${data.totalElements} registros` : 'Carregando registros'}</small></div></div>
      {!isAuthenticated && <span className="read-only-note">Entre como abrigo para cadastrar ou editar</span>}
    </div>
    {loading ? <div className="table-skeleton">{Array.from({ length: 5 }, (_, i) => <div className="skeleton skeleton-row" key={i} />)}</div>
      : error ? <ErrorState message={error} retry={load} />
        : data?.content.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Adotante</th><th>Contato</th><th>Data de nascimento</th>{isAuthenticated && <th className="table-actions-col">Ações</th>}</tr></thead>
          <tbody>{data.content.map((adopter) => <tr key={adopter.id}>
            <td><div className="table-person"><span className="table-avatar"><UserRound size={17} /></span><span><strong>{adopter.nome}</strong><small>{adopter.email}</small></span></div></td>
            <td><div className="contact-lines"><span><Mail size={14} />{adopter.email}</span><span><Phone size={14} />{adopter.telefone || 'Não informado'}</span></div></td>
            <td>{formatDate(adopter.dataNascimento)}</td>
            {isAuthenticated && <td><div className="table-actions"><button className="icon-button" onClick={() => openForm(adopter)} aria-label={`Editar ${adopter.nome}`} title="Editar"><Pencil size={16} /></button><button className="icon-button danger-icon" onClick={() => setDeleting(adopter)} aria-label={`Excluir ${adopter.nome}`} title="Excluir"><Trash2 size={16} /></button></div></td>}
          </tr>)}</tbody></table></div>
          : <EmptyState title="Nenhum adotante cadastrado" description={isAuthenticated ? 'Cadastre seu primeiro adotante para organizar os processos de adoção.' : 'Os registros de adotantes aparecerão aqui.'} action={isAuthenticated ? <button className="button button-primary button-small" onClick={() => openForm()}><Plus size={15} /> Cadastrar adotante</button> : undefined} />}
    {data && <Pagination data={data} onPage={setPageNo} />}
    {editing !== undefined && <AdopterFormModal adopter={editing} busy={busy} error={formError} onClose={() => setEditing(undefined)} onSubmit={submit} />}
    {deleting && <Modal title="Excluir adotante?" description={`Excluir ${deleting.nome}? O backend pode impedir a ação caso existam adoções vinculadas.`} onClose={() => setDeleting(null)}>
      <div className="modal-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button button-danger" disabled={busy} onClick={remove}>{busy ? <Spinner label="Excluindo..." /> : <><Trash2 size={16} /> Excluir adotante</>}</button></div>
    </Modal>}
  </div>
}

function AdopterFormModal({ adopter, busy, error, onClose, onSubmit }: {
  adopter: Adopter | null; busy: boolean; error: string; onClose: () => void; onSubmit: (values: AdopterForm) => Promise<void>
}) {
  const [values, setValues] = useState<AdopterForm>(adopter ? {
    nome: adopter.nome, email: adopter.email, telefone: adopter.telefone || '', dataNascimento: adopter.dataNascimento || '',
  } : empty)
  const set = (key: keyof AdopterForm) => (event: ChangeEvent<HTMLInputElement>) => setValues((old) => ({ ...old, [key]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); void onSubmit(values) }
  return <Modal title={adopter ? 'Editar adotante' : 'Cadastrar adotante'} description="Os dados são utilizados no acompanhamento das adoções." onClose={onClose}>
    <form className="modal-form" onSubmit={submit}>
      <InputField label="Nome completo" name="nome" maxLength={150} required value={values.nome} onChange={set('nome')} />
      <InputField label="E-mail" name="email" type="email" maxLength={255} required value={values.email} onChange={set('email')} />
      <InputField label="Telefone" name="telefone" type="tel" maxLength={20} required value={values.telefone} onChange={set('telefone')} />
      <InputField label="Data de nascimento" name="dataNascimento" type="date" value={values.dataNascimento} onChange={set('dataNascimento')} />
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? <Spinner label="Salvando..." /> : adopter ? 'Salvar alterações' : 'Cadastrar adotante'}</button></div>
    </form>
  </Modal>
}
