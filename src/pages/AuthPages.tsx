import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Heart, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { InputField, TextareaField } from '../components/FormField'
import { Spinner } from '../components/Feedback'
import { api, ApiRequestError } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import type { Authentication } from '../types/api'

function AuthFrame({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="auth-page">
    <section className="auth-art">
      <Link className="brand auth-brand" to="/"><span className="brand-mark"><Heart size={19} fill="currentColor" /></span><span>adota<span className="brand-accent">pet</span></span></Link>
      <div className="auth-art-content"><span className="eyebrow">CUIDAR TAMBÉM É CONECTAR</span>
        <h1>Todo pet merece<br />um lugar para<br /><em>chamar de lar.</em></h1>
        <p>Uma rede de cuidado que aproxima abrigos, pessoas e histórias que ainda vão começar.</p>
        <div className="art-paws"><span>✳</span><span>✳</span><span>✳</span></div>
      </div>
      <span className="auth-art-footer">Uma plataforma feita com carinho para quem cuida.</span>
      <div className="art-blob art-blob-one" /><div className="art-blob art-blob-two" />
    </section>
    <section className="auth-form-side">
      <div className="auth-card">
        <span className="auth-icon"><Heart size={21} /></span>
        <p className="eyebrow">{title === 'Acesso do abrigo' ? 'BEM-VINDO DE VOLTA' : 'ESTAMOS JUNTOS NESSA'}</p>
        <h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{children}
        <div className="auth-security"><ShieldCheck size={15} /> Seus dados são protegidos com segurança.</div>
      </div>
    </section>
  </div>
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await api.post<Authentication>('/auth/login', { email, senha })
      login(response.token, response.name)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível entrar agora.')
    } finally {
      setBusy(false)
    }
  }
  return <AuthFrame title="Acesso do abrigo" subtitle="Entre para acompanhar pets, adotantes e adoções do seu abrigo.">
    <form className="form-stack" onSubmit={submit}>
      <InputField label="E-mail" name="email" type="email" autoComplete="email" placeholder="voce@abrigo.com.br" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <InputField label="Senha" name="senha" type="password" autoComplete="current-password" placeholder="Sua senha" required value={senha} onChange={(e) => setSenha(e.target.value)} />
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="form-inline-end"><Link to="/recuperar-senha">Esqueceu a senha?</Link></div>
      <button className="button button-primary button-full" disabled={busy}>{busy ? <Spinner label="Entrando..." /> : <>Entrar na plataforma <ArrowRight size={17} /></>}</button>
    </form>
    <div className="auth-switch">Seu abrigo ainda não está aqui? <Link to="/cadastro">Cadastre-se</Link></div>
  </AuthFrame>
}

interface RegisterFields {
  nome: string; email: string; senha: string; repetirSenha: string; telefone: string
  cnpj: string; horarioFuncionamento: string; descricao: string; fotoUrl: string
  logradouro: string; cep: string; numero: string; bairro: string; cidade: string; estado: string; latitude: string; longitude: string
}

const initialRegister: RegisterFields = {
  nome: '', email: '', senha: '', repetirSenha: '', telefone: '', cnpj: '', horarioFuncionamento: '', descricao: '', fotoUrl: '',
  logradouro: '', cep: '', numero: '', bairro: '', cidade: '', estado: '', latitude: '', longitude: '',
}

export function RegisterPage() {
  const [values, setValues] = useState(initialRegister)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const set = (key: keyof RegisterFields) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((previous) => ({ ...previous, [key]: event.target.value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (values.senha !== values.repetirSenha) { setError('As senhas não coincidem.'); return }
    setBusy(true)
    try {
      const { latitude, longitude } = values
      const response = await api.post<Authentication>('/auth/register', {
        nome: values.nome, email: values.email, senha: values.senha, repetirSenha: values.repetirSenha,
        telefone: values.telefone, cnpj: values.cnpj || null,
        horarioFuncionamento: values.horarioFuncionamento || null, descricao: values.descricao || null, fotoUrl: values.fotoUrl || null,
        endereco: {
          logradouro: values.logradouro, cep: values.cep, numero: values.numero, bairro: values.bairro,
          cidade: values.cidade, estado: values.estado,
          latitude: latitude === '' ? null : Number(latitude), longitude: longitude === '' ? null : Number(longitude),
        },
      })
      login(response.token, response.name)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível cadastrar o abrigo.')
    } finally { setBusy(false) }
  }
  return <AuthFrame title="Cadastre seu abrigo" subtitle="Crie seu acesso para apresentar seus pets e acompanhar cada adoção.">
    <form className="form-stack register-form" onSubmit={submit}>
      <div className="form-section-title">Sobre o abrigo</div>
      <div className="form-grid">
        <InputField label="Nome do abrigo" name="nome" maxLength={150} required value={values.nome} onChange={set('nome')} />
        <InputField label="E-mail" name="email" type="email" maxLength={255} required value={values.email} onChange={set('email')} />
        <InputField label="Telefone" name="telefone" type="tel" maxLength={20} required value={values.telefone} onChange={set('telefone')} />
        <InputField label="CNPJ" name="cnpj" maxLength={14} hint="Opcional · até 14 caracteres" value={values.cnpj} onChange={set('cnpj')} />
      </div>
      <InputField label="Horário de funcionamento" name="horarioFuncionamento" maxLength={255} placeholder="Ex.: Seg a sex, 9h às 17h" value={values.horarioFuncionamento} onChange={set('horarioFuncionamento')} />
      <TextareaField label="Apresentação" name="descricao" rows={3} value={values.descricao} onChange={set('descricao')} />
      <InputField label="URL da foto do abrigo" name="fotoUrl" type="url" value={values.fotoUrl} onChange={set('fotoUrl')} />
      <div className="form-section-title">Endereço</div>
      <div className="form-grid">
        <InputField label="Logradouro" name="logradouro" maxLength={150} required value={values.logradouro} onChange={set('logradouro')} />
        <InputField label="Número" name="numero" maxLength={20} required value={values.numero} onChange={set('numero')} />
        <InputField label="Bairro" name="bairro" maxLength={100} required value={values.bairro} onChange={set('bairro')} />
        <InputField label="CEP" name="cep" required maxLength={8} hint="Até 8 caracteres, sem formatação" value={values.cep} onChange={set('cep')} />
        <InputField label="Cidade" name="cidade" maxLength={100} required value={values.cidade} onChange={set('cidade')} />
        <InputField label="Estado (UF)" name="estado" required maxLength={2} value={values.estado} onChange={set('estado')} />
        <InputField label="Latitude" name="latitude" type="number" step="any" min="-90" max="90" hint="Opcional · usada na busca por proximidade" value={values.latitude} onChange={set('latitude')} />
        <InputField label="Longitude" name="longitude" type="number" step="any" min="-180" max="180" value={values.longitude} onChange={set('longitude')} />
      </div>
      <div className="form-section-title">Acesso</div>
      <div className="form-grid">
        <InputField label="Senha" name="senha" type="password" autoComplete="new-password" required value={values.senha} onChange={set('senha')} />
        <InputField label="Repetir senha" name="repetirSenha" type="password" autoComplete="new-password" required value={values.repetirSenha} onChange={set('repetirSenha')} />
      </div>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <button className="button button-primary button-full" disabled={busy}>{busy ? <Spinner label="Criando acesso..." /> : <>Criar conta do abrigo <ArrowRight size={17} /></>}</button>
      <div className="auth-switch">Já possui acesso? <Link to="/login">Entrar</Link></div>
    </form>
  </AuthFrame>
}

export function RequestResetPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      await api.post<void>('/auth/request-password-reset', { email })
      setSent(true)
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Não foi possível solicitar a recuperação.') }
    finally { setBusy(false) }
  }
  return <AuthFrame title="Recuperar acesso" subtitle="Informe o e-mail usado no cadastro do seu abrigo.">
    {sent
      ? <div className="reset-success"><span className="success-badge"><Mail size={22} /></span><h3>Solicitação enviada</h3><p>Se esse e-mail estiver cadastrado, você receberá as instruções de redefinição.</p><Link className="button button-secondary button-full" to="/login"><ArrowLeft size={16} /> Voltar para o acesso</Link></div>
      : <form className="form-stack" onSubmit={submit}><InputField label="E-mail do abrigo" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <div className="form-alert" role="alert">{error}</div>}
        <button className="button button-primary button-full" disabled={busy}>{busy ? <Spinner label="Enviando..." /> : <>Solicitar recuperação <Mail size={16} /></>}</button>
        <Link className="back-link" to="/login"><ArrowLeft size={15} /> Voltar para entrar</Link>
      </form>}
  </AuthFrame>
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const hash = params.get('hash')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const { notify } = useToast()
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return }
    setBusy(true)
    try {
      await api.post<void>(`/auth/resetpassword/?${new URLSearchParams({ id: id || '', hash: hash || '' })}`, { newPassword, confirmPassword })
      setDone(true); notify('Sua senha foi atualizada.')
    } catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Não foi possível redefinir a senha.') }
    finally { setBusy(false) }
  }
  return <AuthFrame title="Nova senha" subtitle="Escolha uma nova senha para acessar sua conta do abrigo.">
    {!id || !hash ? <div className="form-alert">Este link não contém os dados necessários. Use a opção de recuperação para solicitar um novo link.</div>
      : done ? <div className="reset-success"><span className="success-badge"><LockKeyhole size={22} /></span><h3>Senha redefinida</h3><p>Você já pode entrar com a nova senha.</p><Link className="button button-primary button-full" to="/login">Ir para o acesso <ArrowRight size={16} /></Link></div>
        : <form className="form-stack" onSubmit={submit}><InputField label="Nova senha" name="newPassword" type="password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <InputField label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {error && <div className="form-alert" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={busy}>{busy ? <Spinner label="Salvando..." /> : <>Salvar nova senha <LockKeyhole size={16} /></>}</button>
        </form>}
  </AuthFrame>
}
