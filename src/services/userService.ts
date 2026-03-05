import type { Usuario } from '../types';
import { usuarios as mockUsuarios } from '../mocks/mockData';

const usuarios = [...mockUsuarios];

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getUsers(): Promise<Usuario[]> {
    await delay();
    return usuarios.filter(u => u.ativo !== false);
}

export async function getUserById(id: string): Promise<Usuario | undefined> {
    await delay();
    const usuario = usuarios.find(u => u.id === id);
    return usuario?.ativo !== false ? usuario : undefined;
}

export async function getTechnicians(): Promise<Usuario[]> {
    await delay();
    return usuarios.filter(u => u.role === 'tecnico' && u.ativo !== false);
}

export async function addUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    await delay();
    const newUsuario = { ...usuario, id: `u${usuarios.length + 1}`, ativo: true };
    usuarios.push(newUsuario);
    return newUsuario;
}

export async function updateUsuario(id: string, data: Partial<Usuario>): Promise<Usuario> {
    await delay();
    const index = usuarios.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuário não encontrado');
    usuarios[index] = { ...usuarios[index], ...data };
    return usuarios[index];
}

export async function deleteUsuario(id: string): Promise<void> {
    await delay();
    const index = usuarios.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuário não encontrado');
    usuarios[index].ativo = false; // Soft delete
}
