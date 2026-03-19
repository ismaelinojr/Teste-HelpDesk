import { withTimeout, withRetry } from './promiseUtils';

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

    return withRetry(
        () => withTimeout(fn(), timeoutMs, errorMessage),
        retries,
        1000,
        onRetry
    );
}

/**
 * Helper específico para mutações (Insert/Update/Delete) que costumam ser mais críticas.
 */
export async function execMutation<T>(
    fn: () => Promise<T>,
    errorMessage: string = 'Falha ao salvar dados. Verifique sua conexão.'
): Promise<T> {
    return execResilient(fn, {
        timeoutMs: 20000,
        retries: 1, // Menos retentativas para mutações para evitar duplicidade ou espera excessiva
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
        timeoutMs: 15000,
        retries: 3,
        errorMessage
    });
}
