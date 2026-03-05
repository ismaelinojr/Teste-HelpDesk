import type { CategoriaChamado } from '../types';
import { categoriasChamado as mockCategorias } from '../mocks/mockData';

let categorias = [...mockCategorias];

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCategorias(): Promise<CategoriaChamado[]> {
    await delay();
    return categorias.filter(c => c.ativo !== false);
}

export async function addCategoria(categoria: Omit<CategoriaChamado, 'id'>): Promise<CategoriaChamado> {
    await delay();
    const newCategoria = { ...categoria, id: `cat${categorias.length + 1}`, ativo: true };
    categorias.push(newCategoria);
    return newCategoria;
}

export async function updateCategoria(id: string, data: Partial<CategoriaChamado>): Promise<CategoriaChamado> {
    await delay();
    const index = categorias.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Categoria não encontrada');
    categorias[index] = { ...categorias[index], ...data };
    return categorias[index];
}

export async function deleteCategoria(id: string): Promise<void> {
    await delay();
    const index = categorias.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Categoria não encontrada');
    categorias[index].ativo = false; // Soft delete
}
