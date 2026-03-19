import { withTimeout, withRetry } from './promiseUtils';

// Monitor global de saúde da conexão
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 5; // Aumentado de 3 para 5 para ser menos sensível

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
                // Log de aviso mas sem incrementar consecutiveFailures aqui para não ser hipersensível
                console.warn(`[SupabaseUtils] Tentativa de conexão ${attempt}/${retries} falhou:`, error.message);
            }
        );
        
        // Sucesso! Resetamos o contador
        resetConsecutiveFailures();
        return result;
    } catch (error: any) {
        // Se após todos os retries ainda falhou, agora sim incrementamos o contador global
        if (error.isTimeout || !navigator.onLine || error.message?.includes('fetch')) {
            consecutiveFailures++;
            console.error(`[SupabaseUtils] Chamada falhou permanentemente (${consecutiveFailures}/${FAILURE_THRESHOLD}):`, error.message);
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
