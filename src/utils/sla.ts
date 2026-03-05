import type { Chamado, SLAInfo, SLAStatus } from '../types';

export function calcularSLA(chamado: Chamado): SLAInfo {
    // Chamados fechados: calcular com base no tempo real de resolução
    if (chamado.status === 'fechado' && chamado.dataFechamento) {
        const inicio = new Date(chamado.dataInicio || chamado.dataAbertura).getTime();
        const fim = new Date(chamado.dataFechamento).getTime();
        const tempoTotalMs = chamado.slaHoras * 60 * 60 * 1000;
        const tempoDecorridoMs = fim - inicio;
        const percentual = Math.round((tempoDecorridoMs / tempoTotalMs) * 100);

        let status: SLAStatus = 'ok';
        if (percentual >= 100) status = 'vencido';
        else if (percentual >= 75) status = 'atencao';

        return {
            percentual,
            status,
            tempoRestanteMs: tempoTotalMs - tempoDecorridoMs,
            tempoDecorridoMs,
            tempoTotalMs,
        };
    }

    // Chamados em andamento: calcular em tempo real
    const agora = Date.now();
    const inicio = new Date(chamado.dataInicio || chamado.dataAbertura).getTime();
    const tempoTotalMs = chamado.slaHoras * 60 * 60 * 1000;
    const tempoDecorridoMs = agora - inicio;
    const tempoRestanteMs = tempoTotalMs - tempoDecorridoMs;
    const percentual = Math.round((tempoDecorridoMs / tempoTotalMs) * 100);

    let status: SLAStatus = 'ok';
    if (percentual >= 100) status = 'vencido';
    else if (percentual >= 75) status = 'atencao';

    return {
        percentual,
        status,
        tempoRestanteMs,
        tempoDecorridoMs,
        tempoTotalMs,
    };
}

export function formatarTempo(ms: number): string {
    const abs = Math.abs(ms);
    const horas = Math.floor(abs / (1000 * 60 * 60));
    const minutos = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

    if (ms < 0) {
        return `Vencido há ${horas}h ${minutos}min`;
    }
    if (horas === 0) {
        return `${minutos}min restantes`;
    }
    return `${horas}h ${minutos}min restantes`;
}

export function formatarData(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatarDataCurta(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
