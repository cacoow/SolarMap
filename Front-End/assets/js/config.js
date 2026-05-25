//Configuracao do Supabase

//Valores do Supabase
const SUPABASE_URL = 'https://fvxkeijahtqrmzvupupv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGtlaWphaHRxcm16dnVwdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzE1MjUsImV4cCI6MjA5MTE0NzUyNX0.HDd8A62e8A60KQHOJaIQ2qskSguL2e-8VmtLYkckcyI'; 

// Verifica se as credenciais foram configuradas
if (SUPABASE_URL === 'https://fvxkeijahtqrmzvupupv.supabase.co' || SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGtlaWphaHRxcm16dnVwdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzE1MjUsImV4cCI6MjA5MTE0NzUyNX0.HDd8A62e8A60KQHOJaIQ2qskSguL2e-8VmtLYkckcyI') {
    console.warn('⚠️ AVISO: Credenciais do Supabase não configuradas!');
    console.warn('📝 Configure seus valores em: Front-End/assets/js/config.js');
    console.warn('📖 Instruções: Acesse https://supabase.com > Settings > API para copiar suas credenciais');
}
