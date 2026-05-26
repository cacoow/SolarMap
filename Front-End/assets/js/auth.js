/*
    Sistema de Autenticação com Supabase
    Gerencia login, cadastro e verificação de sessão
*/

// Importar Supabase JS library (CDN será carregada no HTML)
class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.initSupabase();
    }

    //Inicializar cliente Supabase
    initSupabase() {
        if (window.supabase) {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase inicializado com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao inicializar Supabase:', error);
            }
        } else {
            console.error('❌ Biblioteca Supabase não carregada! Verifique se o script foi carregado.');
        }
    }

    /**
     * CADASTRO - Criar novo usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @param {object} userData - Dados adicionais (nome, companhia, etc)
     * @returns {Promise} - Resultado da operação
     */
    async signup(email, password, userData = {}) {
        try {
            if (!this.supabase) this.initSupabase();
            
            if (!this.supabase) {
                throw new Error('Supabase não inicializado');
            }

            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData, // Metadados do usuário
                    emailRedirectTo: `${window.location.origin}/Front-End/pages/login.html`,
                }
            });

            if (error) throw error;

            // Salvar dados adicionais na tabela 'profiles'
            if (data.user) {
                await this.createUserProfile(data.user.id, userData);
            }

            return {
                success: true,
                message: 'Cadastro realizado! Verifique seu email para confirmar.',
                user: data.user
            };
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            return {
                success: false,
                message: this.formatErrorMessage(error.message),
                error: error
            };
        }
    }

    /**
     * LOGIN - Autenticar usuário existente
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} - Resultado da operação
     */
    async login(email, password) {
        try {
            if (!this.supabase) this.initSupabase();

            if (!this.supabase) {
                throw new Error('Supabase não inicializado');
            }

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Login realizado com sucesso!',
                user: data.user,
                session: data.session
            };
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return {
                success: false,
                message: this.formatErrorMessage(error.message),
                error: error
            };
        }
    }

    /**
     * LOGOUT - Desconectar usuário
     * @returns {Promise}
     */
    async logout() {
        try {
            if (!this.supabase) this.initSupabase();
            
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            return {
                success: true,
                message: 'Desconectado com sucesso!'
            };
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
            return {
                success: false,
                message: 'Erro ao desconectar',
                error: error
            };
        }
    }

    /**
     * RECUPERAR SESSÃO - Verificar se usuário está logado
     * @returns {Promise}
     */
    async getSession() {
        try {
            const { data, error } = await this.supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.error('❌ Erro ao recuperar sessão:', error);
            return null;
        }
    }

    /**
     * OBTER USUÁRIO ATUAL
     * @returns {Promise}
     */
    async getCurrentUser() {
        try {
            const { data, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return data.user;
        } catch (error) {
            console.error('❌ Erro ao obter usuário:', error);
            return null;
        }
    }

    /**
     * Criar perfil do usuário na tabela 'profiles'
     * @param {string} userId - ID do usuário
     * @param {object} userData - Dados do usuário
     */
    async createUserProfile(userId, userData) {
        try {
            const { error } = await this.supabase.from('profiles').insert([
                {
                    id: userId,
                    email: userData.email || '',
                    full_name: userData.full_name || '',
                    company: userData.company || '',
                    avatar_url: null,
                    created_at: new Date()
                }
            ]);

            if (error) throw error;
        } catch (error) {
            console.warn('⚠️ Aviso ao criar perfil:', error.message);
        }
    }

    /**
     * RECUPERAR SENHA - Enviar email de reset
     * @param {string} email - Email do usuário
     * @returns {Promise}
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/Front-End/pages/reset-password.html`
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
            };
        } catch (error) {
            console.error('❌ Erro ao recuperar senha:', error);
            return {
                success: false,
                message: this.formatErrorMessage(error.message),
                error: error
            };
        }
    }

    /**
     * Formatar mensagens de erro em português
     * @param {string} errorMessage - Mensagem de erro original
     * @returns {string} - Mensagem formatada
     */
    formatErrorMessage(errorMessage) {
        const messages = {
            'Invalid login credentials': 'Email ou senha incorretos',
            'User already registered': 'Este email já está cadastrado',
            'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
            'Signup requires a valid password': 'Senha é obrigatória',
            'Invalid email': 'Email inválido',
            'To sign up, please provide your email and password': 'Email e senha são obrigatórios'
        };

        return messages[errorMessage] || errorMessage || 'Erro ao processar requisição';
    }
}

// Instanciar o objeto de autenticação globalmente
const auth = new SupabaseAuth();

// Lógica para atualizar a interface em todas as páginas
document.addEventListener('DOMContentLoaded', async () => {
    // Controle central do painel de perfil (Sidebar)
    const initProfilePanel = () => {
        const profileIcon = document.querySelector('.profile-icon');
        const profilePanel = document.querySelector('.profile-panel');
        const profileContainer = document.querySelector('.profile-container');

        if (profileIcon && profilePanel) {
            profileIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                profilePanel.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (profileContainer && !profileContainer.contains(e.target)) {
                    profilePanel.classList.remove('active');
                }
            });

            const profileMenuLinks = document.querySelectorAll('.profile-panel-menu a, .profile-panel-logout a, .profile-panel-login a');
            profileMenuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    profilePanel.classList.remove('active');
                });
            });
        }
    };

    // Função para sincronizar a UI do painel lateral
    const syncSidebarUI = (user) => {
        const nameEl = document.getElementById('user-name');
        const emailEl = document.getElementById('user-email');
        const loginSection = document.getElementById('auth-login-section');
        const logoutSection = document.getElementById('auth-logout-section');
        const logoutLink = document.getElementById('logout-link');

        if (user) {
            const fullName = user.user_metadata?.full_name || 'Usuário';
            if (nameEl) nameEl.textContent = fullName;
            if (emailEl) emailEl.textContent = user.email;
            if (loginSection) loginSection.style.display = 'none';
            if (logoutSection) logoutSection.style.display = 'block';

            // Sincroniza com o localStorage para que as páginas (perfil, etc) reconheçam o login
            const localData = JSON.parse(localStorage.getItem('solarmap_user') || '{}');
            localStorage.setItem('solarmap_user', JSON.stringify({
                ...localData,
                name: fullName,
                email: user.email,
                id: user.id
            }));
        } else {
            // Se não há sessão no Supabase, verifica se existe usuário no localStorage (Demo ou persistido)
            const localUser = JSON.parse(localStorage.getItem('solarmap_user') || '{}');
            if (localUser.email) {
                if (nameEl) nameEl.textContent = localUser.name || 'Usuário';
                if (emailEl) emailEl.textContent = localUser.email;
                if (loginSection) loginSection.style.display = 'none';
                if (logoutSection) logoutSection.style.display = 'block';
            } else {
                if (nameEl) nameEl.textContent = 'Visitante';
                if (emailEl) emailEl.textContent = 'Faça login para salvar dados';
                if (loginSection) loginSection.style.display = 'block';
                if (logoutSection) logoutSection.style.display = 'none';
            }
        }

        // Configurar evento de Logout (apenas uma vez)
        if (logoutLink && !logoutLink.dataset.listenerSet) {
            logoutLink.dataset.listenerSet = 'true';
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const result = await auth.logout();
                if (result.success) {
                    localStorage.removeItem('solarmap_user');
                    localStorage.removeItem('solarmap_email');
                    const isSubPage = window.location.pathname.includes('/pages/');
                    window.location.href = isSubPage ? '../index.html' : 'index.html';
                }
            });
        }
    };

    // Inicializa o comportamento do clique no perfil
    initProfilePanel();

    // Executa a verificação imediatamente
    const session = await auth.getSession();
    syncSidebarUI(session?.user);

    // Re-checa após 500ms apenas para garantir que o estado do Supabase foi recuperado
    setTimeout(async () => {
        const refreshedSession = await auth.getSession();
        syncSidebarUI(refreshedSession?.user);
    }, 500);
});
