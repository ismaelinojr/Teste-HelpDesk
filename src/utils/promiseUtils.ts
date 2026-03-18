/**
 * Envolve uma Promise com um tempo limite (timeout).
 * Se a Promise original não resolver ou rejeitar dentro do tempo especificado,
 * ela será rejeitada com um erro de timeout.
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 15000,
    errorMessage: string = 'A operação demorou muito para responder. Verifique sua conexão.'
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error: any) {
        clearTimeout(timeoutId!);
        if (error.message === errorMessage) {
            error.isTimeout = true;
        }
        throw error;
    }
}

/**
 * Tenta executar uma função assíncrona múltiplas vezes em caso de erro.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000,
    onRetry?: (error: any, attempt: number) => void
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (onRetry) onRetry(error, attempt);
            
            if (attempt < retries) {
                // Espera antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff simples
            }
        }
    }

    throw lastError;
}
