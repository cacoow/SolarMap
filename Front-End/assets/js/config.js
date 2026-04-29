//Configuracao do Supabase

//Valores do Supabase
const SUPABASE_URL = 'Nosso subase URL';
const SUPABASE_ANON_KEY = 'Nossa API KEY'; 

// Verifica se as credenciais foram configuradas
if (SUPABASE_URL === 'Nosso supabase URL' || SUPABASE_ANON_KEY === 'Nossa API KEY') {
    console.warn('⚠️ AVISO: Credenciais do Supabase não configuradas!');
    console.warn('📝 Configure seus valores em: Front-End/assets/js/config.js');
    console.warn('📖 Instruções: Acesse https://supabase.com > Settings > API para copiar suas credenciais');
}
