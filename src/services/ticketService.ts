import { supabase } from '../lib/supabaseClient';
import type { Chamado, Interacao, StatusChamado } from '../types';
import { execQuery, execMutation } from '../utils/supabaseUtils';

// Mapeamento snake_case → camelCase
function mapChamado(row: Record<string, unknown>): Chamado {
    return {
        id: row.id as string,
        numero: row.numero as number,
        clienteId: row.cliente_id as string,
        contatoNome: row.contato_nome as string | undefined,
        categoriaId: row.categoria_id as string,
        descricao: row.descricao as string,
        titulo: row.titulo as string,
        status: row.status as StatusChamado,
        prioridade: row.prioridade as string,
        tecnicoId: (row.tecnico_id as string) || null,
        slaHoras: row.sla_horas as number,
        dataAbertura: row.data_abertura as string,
        dataInicio: (row.data_inicio as string) || null,
        dataFechamento: (row.data_fechamento as string) || null,
        solucaoFinal: (row.solucao_final as string) || null,
    };
}

function mapInteracao(row: Record<string, unknown>): Interacao {
    return {
        id: row.id as string,
        chamadoId: row.chamado_id as string,
        usuarioId: row.usuario_id as string,
        mensagem: row.mensagem as string,
        createdAt: row.created_at as string,
    };
}

export async function getTickets(): Promise<Chamado[]> {
    try {
        const data = await execQuery(
            async () => {
                const { data, error } = await supabase
                    .from('chamados')
                    .select('*')
                    .order('data_abertura', { ascending: false });
                if (error) throw error;
                return data;
            },
            'Erro ao carregar chamados: verifique sua rede.'
        );
        
        return (data ?? []).map(mapChamado);
    } catch (error) {
        console.error('[TicketService] Erro ao buscar chamados:', error);
        throw error;
    }
}

export async function getTicketById(id: string): Promise<Chamado | undefined> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('chamados')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    });
    return data ? mapChamado(data) : undefined;
}

export async function getTicketsByTecnico(tecnicoId: string): Promise<Chamado[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('chamados')
            .select('*')
            .eq('tecnico_id', tecnicoId)
            .order('data_abertura', { ascending: false });
        if (error) throw error;
        return data;
    });
    return (data ?? []).map(mapChamado);
}

export async function updateTicketStatus(id: string, status: StatusChamado): Promise<Chamado | undefined> {
    const updates: Record<string, unknown> = { status };

    if (status === 'aberto') {
        updates.tecnico_id = null;
    }
    if (status === 'em_atendimento') {
        // Apenas definir data_inicio se ainda não tiver
        const existing = await getTicketById(id);
        if (existing && !existing.dataInicio) {
            updates.data_inicio = new Date().toISOString();
        }
    }
    if (status === 'fechado') {
        updates.data_fechamento = new Date().toISOString();
    }
    if (status === 'programacao') {
        updates.prioridade = 'programacao';
        updates.sla_horas = 72;
    }

    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('chamados')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();
        if (error) throw error;
        return data;
    }, 'Erro ao atualizar status do chamado.');

    return data ? mapChamado(data) : undefined;
}

export async function assignTechnician(id: string, tecnicoId: string): Promise<Chamado | undefined> {
    // Verificar se já tem data_inicio
    const existing = await getTicketById(id);
    const updates: Record<string, unknown> = {
        tecnico_id: tecnicoId,
        status: 'em_atendimento',
    };
    if (existing && !existing.dataInicio) {
        updates.data_inicio = new Date().toISOString();
    }

    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('chamados')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();
        if (error) throw error;
        return data;
    }, 'Erro ao assumir o chamado.');

    return data ? mapChamado(data) : undefined;
}

export async function closeTicket(id: string, solucao: string): Promise<Chamado | undefined> {
    try {
        const data = await execMutation(async () => {
            const { data, error } = await supabase
                .from('chamados')
                .update({
                    status: 'fechado',
                    solucao_final: solucao,
                    data_fechamento: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .maybeSingle();
            if (error) throw error;
            return data;
        }, 'Erro ao encerrar chamado: tempo limite excedido. Tente novamente.');

        return data ? mapChamado(data) : undefined;
    } catch (error) {
        console.error('[TicketService] Erro no closeTicket:', error);
        throw error;
    }
}

export async function getInteracoes(chamadoId: string): Promise<Interacao[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('interacoes')
            .select('*')
            .eq('chamado_id', chamadoId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    });
    return (data ?? []).map(mapInteracao);
}

export async function getAllInteracoes(): Promise<Interacao[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('interacoes')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    });
    return (data ?? []).map(mapInteracao);
}

export async function addInteracao(chamadoId: string, usuarioId: string, mensagem: string): Promise<Interacao> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('interacoes')
            .insert({
                chamado_id: chamadoId,
                usuario_id: usuarioId,
                mensagem,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao adicionar nota ao chamado.');
    return mapInteracao(data);
}

export async function createTicket(ticketData: Omit<Chamado, 'id' | 'numero' | 'dataAbertura' | 'dataInicio' | 'dataFechamento' | 'solucaoFinal'>): Promise<Chamado> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('chamados')
            .insert({
                cliente_id: ticketData.clienteId,
                contato_nome: ticketData.contatoNome,
                categoria_id: ticketData.categoriaId,
                titulo: ticketData.titulo,
                descricao: ticketData.descricao,
                status: ticketData.status,
                prioridade: ticketData.prioridade,
                tecnico_id: ticketData.tecnicoId,
                sla_horas: ticketData.slaHoras,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao criar novo chamado.');
    return mapChamado(data);
}

export function resetData() {
    // Não aplicável com Supabase — dados são persistentes
    console.warn('resetData() não é suportado com Supabase');
}
