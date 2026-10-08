import { ArrowUpRight, CalendarDays, Heart, Ruler } from 'lucide-react'
import type { Pet } from '../types/api'
import { ageLabel, petStatusLabel } from '../utils/format'

export function PetCard({ pet, onOpen }: { pet: Pet; onOpen: (pet: Pet) => void }) {
  return <article className="pet-card">
    <button className="pet-image-button" onClick={() => onOpen(pet)} aria-label={`Ver detalhes de ${pet.nome}`}>
      {pet.fotoUrl
        ? <img src={pet.fotoUrl} alt={pet.nome} className="pet-image" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('image-fallback') }} />
        : <span className="pet-image-placeholder"><Heart size={27} /></span>}
      <span className={`pet-status status-${pet.status.toLowerCase()}`}>{petStatusLabel(pet.status)}</span>
      <span className="pet-image-arrow"><ArrowUpRight size={16} /></span>
    </button>
    <div className="pet-card-body">
      <div className="pet-title-row"><h3>{pet.nome}</h3><span className="pet-sex" title={pet.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}>{pet.sexo === 'MACHO' ? 'M' : 'F'}</span></div>
      <p className="pet-breed">{pet.raca} <span>·</span> {pet.especie}</p>
      <div className="pet-facts"><span><CalendarDays size={14} />{ageLabel(pet.idadeEstimadaMeses)}</span><span><Ruler size={14} />{pet.porte.toLowerCase()}</span></div>
      <div className="pet-card-foot"><span className="shelter-chip"><span className="shelter-avatar">{pet.abrigo.nome.slice(0, 1).toUpperCase()}</span>{pet.abrigo.nome}</span>
        <button className="text-link" onClick={() => onOpen(pet)}>Conhecer <ArrowUpRight size={14} /></button>
      </div>
    </div>
  </article>
}
