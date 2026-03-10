import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Sobrescreve a função de lock padrão que usa navigator.locks (Web Locks API).
    // Extensões de carteira cripto injetam um script de lockdown (SES) que
    // silenciosamente quebra a promessa do navigator.locks, congelando a aplicação no carregamento.
    lock: (_name, _acquireTimeout, fn) => fn(),
  }
});
