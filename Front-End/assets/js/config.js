//Configuracao do Supabase

//Valores do Supabase
const SUPABASE_URL = 'supabase_url';
const SUPABASE_ANON_KEY = 'api_key'; 

// Verifica se as credenciais foram configuradas
if (SUPABASE_URL === 'supabase_url' || SUPABASE_ANON_KEY === 'api_key') {
    console.warn('⚠️ AVISO: Credenciais do Supabase não configuradas!');
    console.warn('📝 Configure seus valores em: Front-End/assets/js/config.js');
    console.warn('📖 Instruções: Acesse https://supabase.com > Settings > API para copiar suas credenciais');
}
