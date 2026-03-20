import { withTimeout, withRetry } from './promiseUtils';
import { supabase } from '../lib/supabaseClient';

// Monitor global de saúde da conexão
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 5; // Aumentado de 3 para 5 para ser menos sensível

// Flag para suprimir contagem de falhas logo após retorno de visibilidade
let warmupUntil = 0;

/**
 * Inicia um período de warmup onde falhas de conexão NÃO são contabilizadas.
 * Útil quando a aba volta ao foco e a rede ainda está "acordando".
 */
export function startWarmupPeriod(durationMs: number = 15000) {
    warmupUntil = Date.now() + durationMs;
    console.log(`[SupabaseUtils] Período de warmup iniciado (${durationMs}ms).`);
}

/**
 * Probe leve de conexão: faz uma query mínima para validar se o Supabase responde.
 * Retorna true se o servidor está acessível, false caso contrário.
 */
export async function probeConnection(timeoutMs: number = 8000): Promise<boolean> {
    try {
        await withTimeout(
            Promise.resolve(
                supabase.from('status_configs').select('id').limit(1).then(({ error }) => {
                    if (error) throw error;
                })
            ),
            timeoutMs,
            'Probe de conexão expirou'
        );
        return true;
    } catch {
        return false;
    }
}

export function getConsecutiveFailures() {
    return consecutiveFailures;
}

export function resetConsecutiveFailures() {
    if (consecutiveFailures > 0) {
        console.log('[SupabaseUtils] Conexão saudável: Reset de falhas consecutivas.');
        consecutiveFailures = 0;
    }
}

export function isSystemZombie() {
    return consecutiveFailures >= FAILURE_THRESHOLD;
}

/**
 * Interface para opções de execução resiliente.
 */
interface ResilientOptions {
    timeoutMs?: number;
    retries?: number;
    errorMessage?: string;
    onRetry?: (error: any, attempt: number) => void;
}

/**
 * Executa uma chamada ao Supabase (ou qualquer Promise) com timeout e retry padronizados.
 * 
 * @param fn Função que retorna uma Promise.
 * @param options Opções de customização (timeout, retries, mensagens).
 * @returns O resultado da Promise.
 */
export async function execResilient<T>(
    fn: () => Promise<T>,
    options: ResilientOptions = {}
): Promise<T> {
    const {
        timeoutMs = 15000,
        retries = 2,
        errorMessage = 'A conexão com o servidor demorou muito para responder. Verifique sua internet.',
        onRetry
    } = options;

    try {
        const result = await withRetry(
            () => withTimeout(fn(), timeoutMs, errorMessage),
            retries,
            1500, // Aumentado delay base para 1.5s
            (error, attempt) => {
                if (onRetry) onRetry(error, attempt);
                // Log discreto nas tentativas intermediárias
                console.log(`[SupabaseUtils] Tentativa de conexão ${attempt}/${retries} falhou:`, error.message);
            }
        );
        
        // Sucesso! Resetamos o contador
        resetConsecutiveFailures();
        return result;
    } catch (error: any) {
        // Não contar falhas se: aba oculta, ou em período de warmup pós-foco
        const isWarmup = Date.now() < warmupUntil;
        const isRealFailure = !document.hidden && !isWarmup && (error.isTimeout || !navigator.onLine || error.message?.includes('fetch'));
        if (isRealFailure) {
            consecutiveFailures++;
            console.error(`[SupabaseUtils] Chamada falhou permanentemente (${consecutiveFailures}/${FAILURE_THRESHOLD}):`, error.message);
        } else if (document.hidden) {
            console.log('[SupabaseUtils] Falha ignorada (aba oculta):', error.message);
        } else if (isWarmup) {
            console.log('[SupabaseUtils] Falha ignorada (warmup pós-foco):', error.message);
        }
        throw error;
    }
}

/**
 * Helper específico para mutações (Insert/Update/Delete) que costumam ser mais críticas.
 */
export async function execMutation<T>(
    fn: () => Promise<T>,
    errorMessage: string = 'Falha ao salvar dados. Verifique sua conexão.'
): Promise<T> {
    return execResilient(fn, {
        timeoutMs: 35000, // Aumentado de 20s para 35s
        retries: 2, // Aumentado de 1 para 2 retries para mutações
        errorMessage
    });
}

/**
 * Helper para consultas (Select) que podem ser tentadas mais vezes.
 */
export async function execQuery<T>(
    fn: () => Promise<T>,
    errorMessage: string = 'Erro ao carregar dados do servidor.'
): Promise<T> {
    return execResilient(fn, {
        timeoutMs: 25000, // Aumentado de 15s para 25s
        retries: 3,
        errorMessage
    });
}
