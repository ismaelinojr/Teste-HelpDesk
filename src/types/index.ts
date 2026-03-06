// Tipos principais do sistema I9Chamados

export type StatusChamado = 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'fechado';
export type Prioridade = 'normal' | 'urgente';
export type Role = 'admin' | 'tecnico';

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

export interface ConfigSLA {
  urgente: number;
  normal: number;
}

export type SLAStatus = 'ok' | 'atencao' | 'vencido';

export interface SLAInfo {
  percentual: number;
  status: SLAStatus;
  tempoRestanteMs: number;
  tempoDecorridoMs: number;
  tempoTotalMs: number;
}
