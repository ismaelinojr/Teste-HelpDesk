import type { Cliente, ContatoCliente } from '../types';
import { clientes as mockClientes, contatosClientes as mockContatos } from '../mocks/mockData';

const clientes = [...mockClientes];
let contatos = [...mockContatos];
let nextContatoId = contatos.length + 1;

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getClients(): Promise<Cliente[]> {
    await delay();
    return clientes.filter(c => c.ativo !== false);
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
    await delay();
    const cliente = clientes.find(c => c.id === id);
    return cliente?.ativo !== false ? cliente : undefined;
}

export async function addCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    await delay();
    const newCliente = { ...cliente, id: `c${clientes.length + 1}`, ativo: true };
    clientes.push(newCliente);
    return newCliente;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
    await delay();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    clientes[index] = { ...clientes[index], ...data };
    return clientes[index];
}

export async function deleteCliente(id: string): Promise<void> {
    await delay();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    clientes[index].ativo = false; // Soft delete
}

export async function getContatosByCliente(clienteId: string): Promise<ContatoCliente[]> {
    await delay();
    return contatos.filter(c => c.clienteId === clienteId && c.ativo !== false);
}

export async function addContato(clienteId: string, nome: string, telefone?: string, email?: string, funcao?: string): Promise<ContatoCliente> {
    await delay();
    const novoContato: ContatoCliente = {
        id: `cc${nextContatoId++}`,
        clienteId,
        nome,
        telefone,
        email,
        funcao,
        ativo: true
    };
    contatos.push(novoContato);
    return { ...novoContato };
}

export async function updateContato(id: string, data: Partial<ContatoCliente>): Promise<ContatoCliente> {
    await delay();
    const index = contatos.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contato não encontrado');
    contatos[index] = { ...contatos[index], ...data };
    return contatos[index];
}

export async function deleteContato(id: string): Promise<void> {
    await delay();
    const index = contatos.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contato não encontrado');
    contatos[index].ativo = false;
}
