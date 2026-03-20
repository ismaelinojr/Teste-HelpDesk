import { supabase } from '../lib/supabaseClient';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { withTimeout } from '../utils/promiseUtils';
import { execResilient } from '../utils/supabaseUtils';

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    try {
        // Timeout curto para logout (5s), pois queremos que a UI libere rápido
        await withTimeout(supabase.auth.signOut(), 5000, 'Erro ao deslogar no servidor. Limpando sessão local...');
    } catch (error) {
        console.warn('[AuthService] SignOut error (handled):', error);
        // Não relançamos o erro para permitir que o AppContext continue a limpeza local
    }
}

export async function resetPassword(email: string) {
    // Tenta pegar a URL do site da variável de ambiente, ou usa o origin atual como fallback
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    
    // Envia e-mail real de recuperação via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/login`,
    });
    if (error) throw error;
}

export async function inviteUser(email: string, nome: string, role: string) {
    const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, nome, role }
    });
    if (error) throw error;
    return data;
}

/**
 * Verificação leve de sessão: sem retries, timeout curto.
 * Ideal para retorno rápido de foco (inatividade < 5 min).
 * Retorna: Session (ativa), null (expirada), undefined (erro/timeout).
 */
export async function getSessionQuick(): Promise<Session | null | undefined> {
    try {
        const { data: { session }, error } = await withTimeout(
            supabase.auth.getSession(),
            8000,
            'Timeout rápido ao obter sessão'
        );
        if (error) throw error;
        return session;
    } catch (error) {
        console.log('[AuthService] getSessionQuick falhou (esperado em retorno de inatividade curta):', (error as any).message);
        return undefined;
    }
}

export async function getCurrentSession(): Promise<Session | null | undefined> {
    console.log('[AuthService] Chamando getSession()...');
    
    try {
        const session = await execResilient(
            async () => {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                return session;
            },
            {
                timeoutMs: 15000,
                retries: 2, // Reduzido de 3 para 2 retries
                errorMessage: 'Timeout ao obter sessão do Supabase',
                onRetry: (error, attempt) => console.log(`[AuthService] Retry ${attempt} de getSession:`, error.message)
            }
        );
        
        console.log('[AuthService] getSession() retornou com sucesso:', session ? 'Sessão ativa' : 'Sem sessão');
        return session;
    } catch (error: any) {
        console.log('[AuthService] getSession com retry falhou. Tentando fallback getUser()...');
        
        try {
            // Fallback: getUser() força uma chamada de rede
            const { data: { user }, error: userError } = await withTimeout(
                supabase.auth.getUser(),
                8000, // Reduzido de 15s para 8s
                'Timeout no fallback getUser'
            );
            
            if (userError) throw userError;
            
            if (user) {
                console.log('[AuthService] Fallback getUser() funcionou. Obtendo sessão...');
                const { data: { session } } = await supabase.auth.getSession();
                return session;
            }
            
            return null;
        } catch (fallbackError) {
            console.error('[AuthService] Fallback getUser() também falhou:', (fallbackError as any).message);
            return undefined;
        }
    }
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        return await withTimeout(
            supabase.auth.getUser().then(({ data: { user } }) => user),
            30000, // Aumentado de 20s para 30s
            'Timeout ao obter usuário do Supabase'
        );
    } catch (error) {
        console.error('[AuthService] Erro ao buscar usuário atual:', error);
        return null;
    }
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
}
