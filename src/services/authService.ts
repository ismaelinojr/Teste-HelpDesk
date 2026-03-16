import { supabase } from '../lib/supabaseClient';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { withTimeout } from '../utils/promiseUtils';

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
    
    // Fallback/Timeout setup to prevent navigator.locks deadlocks
    const timeoutPromise = new Promise<undefined>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao obter sessão (possível bloqueio no Web Locks API)')), 5000)
    );

    try {
        const result = await Promise.race([
            supabase.auth.getSession().then(({ data: { session } }) => session),
            timeoutPromise
        ]);
        console.log('[AuthService] getSession() retornou com sucesso:', result ? 'Sessão ativa' : 'Sem sessão');
        return result;
    } catch (error) {
        console.error('[AuthService] Erro ou timeout no getSession:', error);
        // Retornamos undefined para indicar que não conseguimos verificar a sessão técnica (falha técnica)
        // null seria retornado apenas se o Supabase respondesse explicitamente que não há sessão.
        return undefined;
    }
}

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
}
