import type { SLAConfig } from '../types';
import { slaConfigs as mockSLAs } from '../mocks/mockData';

let slas = [...mockSLAs];

function delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getSLAs(): Promise<SLAConfig[]> {
    await delay();
    return slas.filter(s => s.ativo !== false);
}

export async function getAllSLAs(): Promise<SLAConfig[]> {
    await delay();
    return [...slas];
}

export async function addSLA(sla: Omit<SLAConfig, 'id'>): Promise<SLAConfig> {
    await delay();
    const id = sla.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const newSLA: SLAConfig = { ...sla, id, ativo: true };
    slas.push(newSLA);
    return newSLA;
}

export async function updateSLA(id: string, data: Partial<SLAConfig>): Promise<SLAConfig> {
    await delay();
    const index = slas.findIndex(s => s.id === id);
    if (index === -1) throw new Error('SLA não encontrado');
    slas[index] = { ...slas[index], ...data };
    return slas[index];
}

export async function deleteSLA(id: string): Promise<void> {
    await delay();
    const index = slas.findIndex(s => s.id === id);
    if (index === -1) throw new Error('SLA não encontrado');
    slas[index].ativo = false;
}
