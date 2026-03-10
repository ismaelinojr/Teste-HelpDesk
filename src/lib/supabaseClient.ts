import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pirgsvvjhneswqxatkhw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcmdzdnZqaG5lc3dxeGF0a2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzE4NjAsImV4cCI6MjA4ODY0Nzg2MH0.riiyek_2bWNrQ0w80PhDX5R_bW5_8nnB1SZpqKVuQeU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Sobrescreve a função de lock padrão que usa navigator.locks (Web Locks API).
    // Extensões de carteira cripto injetam um script de lockdown (SES) que
    // silenciosamente quebra a promessa do navigator.locks, congelando a aplicação no carregamento.
    lock: (_name, _acquireTimeout, fn) => fn(),
  }
});
