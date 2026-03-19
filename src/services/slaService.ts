import { supabase } from '../lib/supabaseClient';
import type { SLAConfig } from '../types';
import { execQuery, execMutation } from '../utils/supabaseUtils';

export async function getSLAs(): Promise<SLAConfig[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('sla_configs')
            .select('*')
            .eq('ativo', true);
        if (error) throw error;
        return data;
    });
    return data ?? [];
}

export async function getAllSLAs(): Promise<SLAConfig[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('sla_configs')
            .select('*');
        if (error) throw error;
        return data;
    });
    return data ?? [];
}

export async function addSLA(sla: Omit<SLAConfig, 'id'>): Promise<SLAConfig> {
    const id = sla.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('sla_configs')
            .insert({ ...sla, id, ativo: true })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao adicionar configuração de SLA.');
    return data;
}

export async function updateSLA(id: string, updates: Partial<SLAConfig>): Promise<SLAConfig> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('sla_configs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao atualizar configuração de SLA.');
    return data;
}

export async function deleteSLA(id: string): Promise<void> {
    await execMutation(async () => {
        const { error } = await supabase
            .from('sla_configs')
            .update({ ativo: false })
            .eq('id', id);
        if (error) throw error;
    }, 'Erro ao excluir configuração de SLA.');
}
