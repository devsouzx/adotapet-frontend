export type PetStatus = 'DISPONIVEL' | 'ADOTADO' | 'INDISPONIVEL'
export type PetSex = 'MACHO' | 'FEMEA'
export type PetSize = 'PEQUENO' | 'MEDIO' | 'GRANDE'
export type AdoptionStatus = 'ATIVA' | 'ENCERRADA'

export interface Page<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ShelterSummary {
  id: string
  nome: string
}

export interface Address {
  logradouro: string
  cep: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}

export interface Shelter {
  nome: string
  email: string
  telefone: string
  cnpj: string | null
  horarioFuncionamento: string | null
  descricao: string | null
  fotoUrl: string | null
  ativo: boolean
  dataCadastro: string
  endereco: Address
}

export interface Pet {
  id: string
  nome: string
  especie: string
  raca: string
  descricao: string | null
  idadeEstimadaMeses: number | null
  peso: number | null
  fotoUrl: string | null
  dataCadastro: string
  status: PetStatus
  sexo: PetSex
  porte: PetSize
  abrigo: ShelterSummary
}

export interface Adopter {
  id: string
  nome: string
  telefone: string | null
  email: string
  dataNascimento: string | null
}

export interface Adoption {
  id: string
  dataAdocao: string
  status: AdoptionStatus
  observacoes: string | null
  dataEncerramento: string | null
  motivoEncerramento: string | null
  abrigoId: string
  pet: { id: string; nome: string }
  adotante: Adopter
}

export interface Authentication {
  name: string
  token: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  code: string
  message: string
  path: string
  details: Record<string, string>
}
