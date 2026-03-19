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

export async function getCurrentSession(): Promise<Session | null | undefined> {
    console.log('[AuthService] Chamando getSession()...');
    
    try {
        // Usamos execResilient com 10s de timeout e 3 tentativas
        const session = await execResilient(
            async () => {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                return session;
            },
            {
                timeoutMs: 15000, // Aumentado de 10s para 15s
                retries: 3,
                errorMessage: 'Timeout ao obter sessão do Supabase',
                onRetry: (error, attempt) => console.warn(`[AuthService] Tentativa ${attempt} de getSession falhou:`, error.message)
            }
        );
        
        console.log('[AuthService] getSession() retornou com sucesso:', session ? 'Sessão ativa' : 'Sem sessão');
        return session;
    } catch (error: any) {
        console.warn('[AuthService] Todas as tentativas de getSession falharam. Tentando fallback para getUser()...', error);
        
        try {
            // Fallback: getUser() força uma chamada de rede e pode "acordar" a conexão melhor que getSession
            const { data: { user }, error: userError } = await withTimeout(
                supabase.auth.getUser(),
                15000,
                'Timeout no fallback getUser'
            );
            
            if (userError) throw userError;
            
            if (user) {
                console.log('[AuthService] Fallback getUser() funcionou. Tentando obter sessão novamente...');
                const { data: { session } } = await supabase.auth.getSession();
                return session;
            }
            
            return null;
        } catch (fallbackError) {
            console.error('[AuthService] Fallback para getUser() também falhou:', fallbackError);
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
