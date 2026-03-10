// Tipos principais do sistema I9Chamados

export type StatusChamado = string;
export type Prioridade = string;
export type Role = 'admin' | 'tecnico';

// Configuração dinâmica de Status
export interface StatusConfig {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  ordem: number;
  ativo?: boolean;
}

// Configuração dinâmica de SLA/Prioridade
export interface SLAConfig {
  id: string;
  nome: string;
  horas: number;
  cor: string;
  ativo?: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  role: Role;
  email: string;
  ativo?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  contato: string;
  endereco?: string;
  regiao?: 'Norte' | 'Sul';
  ativo?: boolean;
}

export interface ContatoCliente {
  id: string;
  clienteId: string;
  nome: string;
  telefone?: string;
  email?: string;
  funcao?: string;
  ativo?: boolean;
}

export interface CategoriaChamado {
  id: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface Chamado {
  id: string;
  numero: number;
  clienteId: string;
  contatoNome?: string;
  categoriaId: string;
  descricao: string;
  titulo: string;
  status: StatusChamado;
  prioridade: Prioridade;
  tecnicoId: string | null;
  slaHoras: number;
  dataAbertura: string;
  dataInicio: string | null;
  dataFechamento: string | null;
  solucaoFinal: string | null;
}

export interface Interacao {
  id: string;
  chamadoId: string;
  usuarioId: string;
  mensagem: string;
  createdAt: string;
}

export type SLAStatus = 'ok' | 'atencao' | 'vencido';

export interface SLAInfo {
  percentual: number;
  status: SLAStatus;
  tempoRestanteMs: number;
  tempoDecorridoMs: number;
  tempoTotalMs: number;
}
