import type { StatusConfig } from '../types';
import { statusConfigs as mockStatuses } from '../mocks/mockData';

let statuses = [...mockStatuses];

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getStatuses(): Promise<StatusConfig[]> {
    await delay();
    return statuses.filter(s => s.ativo !== false).sort((a, b) => a.ordem - b.ordem);
}

export async function getAllStatuses(): Promise<StatusConfig[]> {
    await delay();
    return [...statuses].sort((a, b) => a.ordem - b.ordem);
}

export async function addStatus(status: Omit<StatusConfig, 'id'>): Promise<StatusConfig> {
    await delay();
    const id = status.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newStatus: StatusConfig = { ...status, id, ativo: true };
    statuses.push(newStatus);
    return newStatus;
}

export async function updateStatus(id: string, data: Partial<StatusConfig>): Promise<StatusConfig> {
    await delay();
    const index = statuses.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Status não encontrado');
    statuses[index] = { ...statuses[index], ...data };
    return statuses[index];
}

export async function deleteStatus(id: string): Promise<void> {
    await delay();
    const index = statuses.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Status não encontrado');
    statuses[index].ativo = false;
}
