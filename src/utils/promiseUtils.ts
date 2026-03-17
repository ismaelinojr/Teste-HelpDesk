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
