import { supabase } from '../lib/supabaseClient';
import type { Cliente, ContatoCliente } from '../types';
import { execQuery, execMutation } from '../utils/supabaseUtils';

// Mapeamento snake_case → camelCase
function mapCliente(row: Record<string, unknown>): Cliente {
    return {
        id: row.id as string,
        nome: row.nome as string,
        contato: row.contato as string,
        endereco: row.endereco as string | undefined,
        regiao: row.regiao as 'Norte' | 'Sul' | undefined,
        ativo: row.ativo as boolean | undefined,
    };
}

function mapContato(row: Record<string, unknown>): ContatoCliente {
    return {
        id: row.id as string,
        clienteId: row.cliente_id as string,
        nome: row.nome as string,
        telefone: row.telefone as string | undefined,
        email: row.email as string | undefined,
        funcao: row.funcao as string | undefined,
        ativo: row.ativo as boolean | undefined,
    };
}

// ===== CLIENTES =====
export async function getClients(): Promise<Cliente[]> {
    const data = await execQuery(async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('ativo', true);
        if (error) throw error;
        return data;
    });
    return (data ?? []).map(mapCliente);
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .maybeSingle();
    if (error) throw error;
    return data ? mapCliente(data) : undefined;
}

export async function addCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('clientes')
            .insert({ 
                nome: cliente.nome, 
                contato: cliente.contato, 
                endereco: cliente.endereco, 
                regiao: cliente.regiao, 
                ativo: true 
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao cadastrar laboratório.');
    return mapCliente(data);
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.contato !== undefined) dbUpdates.contato = updates.contato;
    if (updates.endereco !== undefined) dbUpdates.endereco = updates.endereco;
    if (updates.regiao !== undefined) dbUpdates.regiao = updates.regiao;
    if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;

    const data = await execMutation(async () => {
        const { data, error } = await supabase
            .from('clientes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }, 'Erro ao atualizar laboratório.');
    return mapCliente(data);
}

export async function deleteCliente(id: string): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .update({ ativo: false })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteClienteFisico(id: string): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ===== CONTATOS =====
export async function getAllContatos(): Promise<ContatoCliente[]> {
    const { data, error } = await supabase
        .from('contatos_clientes')
        .select('*')
        .eq('ativo', true);
    if (error) throw error;
    return (data ?? []).map(mapContato);
}

export async function getContatosByCliente(clienteId: string): Promise<ContatoCliente[]> {
    const { data, error } = await supabase
        .from('contatos_clientes')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('ativo', true);
    if (error) throw error;
    return (data ?? []).map(mapContato);
}

export async function addContato(clienteId: string, nome: string, telefone?: string, email?: string, funcao?: string): Promise<ContatoCliente> {
    const { data, error } = await supabase
        .from('contatos_clientes')
        .insert({ cliente_id: clienteId, nome, telefone, email, funcao, ativo: true })
        .select()
        .single();
    if (error) throw error;
    return mapContato(data);
}

export async function updateContato(id: string, updates: Partial<ContatoCliente>): Promise<ContatoCliente> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.telefone !== undefined) dbUpdates.telefone = updates.telefone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.funcao !== undefined) dbUpdates.funcao = updates.funcao;
    if (updates.clienteId !== undefined) dbUpdates.cliente_id = updates.clienteId;
    if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;

    const { data, error } = await supabase
        .from('contatos_clientes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return mapContato(data);
}

export async function deleteContato(id: string): Promise<void> {
    const { error } = await supabase
        .from('contatos_clientes')
        .update({ ativo: false })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteContatoFisico(id: string): Promise<void> {
    const { error } = await supabase
        .from('contatos_clientes')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
