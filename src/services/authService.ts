import { supabase } from '../lib/supabaseClient';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function resetPassword(email: string) {
    // Envia e-mail real de recuperação via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
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

export async function getCurrentSession(): Promise<Session | null> {
    console.log('[AuthService] Chamando getSession()...');
    
    // Fallback/Timeout setup to prevent navigator.locks deadlocks
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao obter sessão (possível bloqueio no Web Locks API)')), 5000)
    );

    try {
        const { data: { session } } = await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
        ]);
        console.log('[AuthService] getSession() retornou com sucesso.');
        return session;
    } catch (error) {
        console.error('[AuthService] Erro ou timeout no getSession:', error);
        return null;
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
