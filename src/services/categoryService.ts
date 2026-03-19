import { supabase } from '../lib/supabaseClient';
import type { CategoriaChamado } from '../types';
import { execQuery, execMutation } from '../utils/supabaseUtils';

export async function getCategorias(): Promise<CategoriaChamado[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('categorias_chamado')
            .select('*')
            .eq('ativo', true);
        if (error) throw error;
        return data;
    });
    return data ?? [];
}

export async function addCategoria(categoria: Omit<CategoriaChamado, 'id'>): Promise<CategoriaChamado> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('categorias_chamado')
            .insert({ ...categoria, ativo: true })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao adicionar categoria.');
    return data;
}

export async function updateCategoria(id: string, updates: Partial<CategoriaChamado>): Promise<CategoriaChamado> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('categorias_chamado')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao atualizar categoria.');
    return data;
}

export async function deleteCategoria(id: string): Promise<void> {
    await execMutation(async () => {
        const { error } = await supabase
            .from('categorias_chamado')
            .update({ ativo: false })
            .eq('id', id);
        if (error) throw error;
    }, 'Erro ao excluir categoria.');
}

export async function deleteCategoriaFisico(id: string): Promise<void> {
    await execMutation(async () => {
        const { error } = await supabase
            .from('categorias_chamado')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }, 'Erro ao remover categoria permanentemente.');
}
