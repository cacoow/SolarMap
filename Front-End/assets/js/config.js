//Configuracao do Supabase

//Valores do Supabase
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_DO_SUPABASE'; 

// Verifica se as credenciais foram configuradas
if (SUPABASE_URL === 'SUA_URL_DO_SUPABASE' || SUPABASE_ANON_KEY === 'SUA_ANON_KEY_DO_SUPABASE') {
    console.warn('⚠️ AVISO: Credenciais do Supabase não configuradas!');
    console.warn('📝 Configure seus valores em: Front-End/assets/js/config.js');
    console.warn('📖 Instruções: Acesse https://supabase.com > Settings > API para copiar suas credenciais');
}
