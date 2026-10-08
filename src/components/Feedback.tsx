import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, PawPrint, X } from 'lucide-react'
import type { Page } from '../types/api'

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return <span className="spinner-wrap"><LoaderCircle className="spinner" size={19} aria-hidden="true" /><span>{label}</span></span>
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return <div className="pet-grid" aria-label="Carregando conteúdo" aria-busy="true">
    {Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index}>
      <div className="skeleton skeleton-image" /><div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" /><div className="skeleton skeleton-button" />
    </div>)}
  </div>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state">
    <span className="empty-icon"><PawPrint size={23} aria-hidden="true" /></span>
    <h3>{title}</h3><p>{description}</p>{action}
  </div>
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-state" role="alert">
    <AlertCircle size={22} aria-hidden="true" />
    <div><strong>Não foi possível carregar</strong><p>{message}</p></div>
    {retry && <button className="button button-secondary button-small" onClick={retry}>Tentar novamente</button>}
  </div>
}

export function Pagination<T>({ data, onPage }: { data: Page<T>; onPage: (page: number) => void }) {
  if (data.totalPages < 2) return null
  return <nav className="pagination" aria-label="Paginação">
    <span className="pagination-caption">{data.totalElements} resultados · página {data.number + 1} de {data.totalPages}</span>
    <div className="pagination-actions">
      <button className="icon-button" disabled={data.first} onClick={() => onPage(data.number - 1)} aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      <button className="icon-button" disabled={data.last} onClick={() => onPage(data.number + 1)} aria-label="Próxima página">
        <ChevronRight size={18} />
      </button>
    </div>
  </nav>
}

export function Modal({ title, description, onClose, children, wide = false }: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const first = dialogRef.current?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')
    first?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'))
        const firstItem = focusable[0]
        const lastItem = focusable[focusable.length - 1]
        if (!firstItem || !lastItem) return
        if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus() }
        else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
      previouslyFocused?.focus()
    }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={dialogRef} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-heading"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
        <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
      </header>
      {children}
    </section>
  </div>
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <span className="field-error" role="alert">{children}</span>
}
