import type { Chamado, Interacao, StatusChamado } from '../types';
import { chamados as mockChamados, interacoes as mockInteracoes } from '../mocks/mockData';

// Cópia mutável dos dados mock
let chamados = [...mockChamados];
let interacoes = [...mockInteracoes];
let nextInteracaoId = interacoes.length + 1;

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getTickets(): Promise<Chamado[]> {
    await delay();
    return [...chamados];
}

export async function getTicketById(id: string): Promise<Chamado | undefined> {
    await delay();
    return chamados.find(c => c.id === id);
}

export async function getTicketsByTecnico(tecnicoId: string): Promise<Chamado[]> {
    await delay();
    return chamados.filter(c => c.tecnicoId === tecnicoId);
}

export async function updateTicketStatus(id: string, status: StatusChamado): Promise<Chamado | undefined> {
    await delay();
    const chamado = chamados.find(c => c.id === id);
    if (!chamado) return undefined;

    chamado.status = status;
    if (status === 'em_atendimento' && !chamado.dataInicio) {
        chamado.dataInicio = new Date().toISOString();
    }
    if (status === 'fechado') {
        chamado.dataFechamento = new Date().toISOString();
    }
    return { ...chamado };
}

export async function assignTechnician(id: string, tecnicoId: string): Promise<Chamado | undefined> {
    await delay();
    const chamado = chamados.find(c => c.id === id);
    if (!chamado) return undefined;

    chamado.tecnicoId = tecnicoId;
    chamado.status = 'em_atendimento';
    if (!chamado.dataInicio) {
        chamado.dataInicio = new Date().toISOString();
    }
    return { ...chamado };
}

export async function closeTicket(id: string, solucao: string): Promise<Chamado | undefined> {
    await delay();
    const chamado = chamados.find(c => c.id === id);
    if (!chamado) return undefined;

    chamado.status = 'fechado';
    chamado.solucaoFinal = solucao;
    chamado.dataFechamento = new Date().toISOString();
    return { ...chamado };
}

export async function getInteracoes(chamadoId: string): Promise<Interacao[]> {
    await delay();
    return interacoes
        .filter(i => i.chamadoId === chamadoId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addInteracao(chamadoId: string, usuarioId: string, mensagem: string): Promise<Interacao> {
    await delay();
    const novaInteracao: Interacao = {
        id: `i${nextInteracaoId++}`,
        chamadoId,
        usuarioId,
        mensagem,
        createdAt: new Date().toISOString(),
    };
    interacoes.push(novaInteracao);
    return { ...novaInteracao };
}

export async function createTicket(data: Omit<Chamado, 'id' | 'dataAbertura' | 'dataInicio' | 'dataFechamento' | 'solucaoFinal'>): Promise<Chamado> {
    await delay();
    const newTicket: Chamado = {
        ...data,
        id: `ch${chamados.length + 1}`,
        slaHoras: data.slaHoras,
        dataAbertura: new Date().toISOString(),
        dataInicio: null,
        dataFechamento: null,
        solucaoFinal: null,
    };
    chamados.push(newTicket);
    return { ...newTicket };
}

export function resetData() {
    chamados = [...mockChamados];
    interacoes = [...mockInteracoes];
    nextInteracaoId = interacoes.length + 1;
}
