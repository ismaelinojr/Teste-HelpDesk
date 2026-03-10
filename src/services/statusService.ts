import { supabase } from '../lib/supabaseClient';
import type { StatusConfig } from '../types';

export async function getStatuses(): Promise<StatusConfig[]> {
    const { data, error } = await supabase
        .from('status_configs')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
    if (error) throw error;
    return data ?? [];
}

export async function getAllStatuses(): Promise<StatusConfig[]> {
    const { data, error } = await supabase
        .from('status_configs')
        .select('*')
        .order('ordem');
    if (error) throw error;
    return data ?? [];
}

export async function addStatus(status: Omit<StatusConfig, 'id'>): Promise<StatusConfig> {
    const id = status.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { data, error } = await supabase
        .from('status_configs')
        .insert({ ...status, id, ativo: true })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateStatus(id: string, updates: Partial<StatusConfig>): Promise<StatusConfig> {
    const { data, error } = await supabase
        .from('status_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteStatus(id: string): Promise<void> {
    const { error } = await supabase
        .from('status_configs')
        .update({ ativo: false })
        .eq('id', id);
    if (error) throw error;
}
