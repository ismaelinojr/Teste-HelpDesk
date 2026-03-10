import { supabase } from '../lib/supabaseClient';
import type { SLAConfig } from '../types';

export async function getSLAs(): Promise<SLAConfig[]> {
    const { data, error } = await supabase
        .from('sla_configs')
        .select('*')
        .eq('ativo', true);
    if (error) throw error;
    return data ?? [];
}

export async function getAllSLAs(): Promise<SLAConfig[]> {
    const { data, error } = await supabase
        .from('sla_configs')
        .select('*');
    if (error) throw error;
    return data ?? [];
}

export async function addSLA(sla: Omit<SLAConfig, 'id'>): Promise<SLAConfig> {
    const id = sla.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { data, error } = await supabase
        .from('sla_configs')
        .insert({ ...sla, id, ativo: true })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateSLA(id: string, updates: Partial<SLAConfig>): Promise<SLAConfig> {
    const { data, error } = await supabase
        .from('sla_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteSLA(id: string): Promise<void> {
    const { error } = await supabase
        .from('sla_configs')
        .update({ ativo: false })
        .eq('id', id);
    if (error) throw error;
}
