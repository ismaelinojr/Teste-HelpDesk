import { supabase } from '../lib/supabaseClient';
import type { Usuario } from '../types';
import { execQuery, execMutation } from '../utils/supabaseUtils';

// Mapeia snake_case do banco para camelCase do frontend
function mapUsuario(row: Record<string, unknown>): Usuario {
    return {
        id: row.id as string,
        auth_id: row.auth_id as string | undefined,
        nome: row.nome as string,
        role: row.role as 'admin' | 'tecnico',
        email: row.email as string,
        ativo: row.ativo as boolean | undefined,
    };
}

export async function getUsers(): Promise<Usuario[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, auth_id, nome, role, email, ativo');
        if (error) throw error;
        return data;
    });
    return (data ?? []).map(mapUsuario);
}

export async function getUserById(id: string): Promise<Usuario | undefined> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, role, email, ativo')
            .eq('id', id)
            .eq('ativo', true)
            .maybeSingle();
        if (error) throw error;
        return data;
    });
    return data ? mapUsuario(data) : undefined;
}

export async function getUserByAuthId(authId: string): Promise<Usuario | undefined> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, role, email, ativo')
            .eq('auth_id', authId)
            .eq('ativo', true)
            .maybeSingle();
        if (error) throw error;
        return data;
    });
    return data ? mapUsuario(data) : undefined;
}

export async function getTechnicians(): Promise<Usuario[]> {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, role, email, ativo')
        .eq('role', 'tecnico')
        .eq('ativo', true);
    if (error) throw error;
    return (data ?? []).map(mapUsuario);
}

export async function addUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .insert({ ...usuario, ativo: true })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao cadastrar usuário.');
    return mapUsuario(data);
}

export async function updateUsuario(id: string, updates: Partial<Usuario>): Promise<Usuario> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao atualizar dados do usuário.');
    return mapUsuario(data);
}

export async function deleteUsuario(id: string): Promise<void> {
    const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteUsuarioFisico(id: string): Promise<void> {
    const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
