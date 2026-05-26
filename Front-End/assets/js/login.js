//Lógica da Página de Login


document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) {
        console.error('❌ Supabase não pôde ser carregado após esperar 5 segundos');
        document.getElementById('message').textContent = '❌ Erro ao carregar biblioteca de autenticação. Recarregue a página.';
        document.getElementById('message').className = 'message error';
        document.getElementById('message').style.display = 'block';
        return;
    }

    // Verificar se usuário já está logado
    const session = await auth.getSession();
    if (session) {
        console.log('✅ Usuário já está logado, redirecionando...');
        window.location.href = 'mapa.html'; // Redirecionar para página autenticada
    }

    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const messageDiv = document.getElementById('message');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // Carregar email salvo se existir
    const savedEmail = localStorage.getItem('solarmap_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    /**
     * Exibir mensagem ao usuário
     */
    function showMessage(message, type = 'error') {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Auto-hide em 5 segundos para mensagens de sucesso
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Desabilitar/Habilitar formulário
    function setFormDisabled(disabled) {
        loginBtn.disabled = disabled;
        emailInput.disabled = disabled;
        passwordInput.disabled = disabled;
        loginBtnText.textContent = disabled ? 'Autenticando...' : 'Entrar';
    }

    // Validar Inputs
    function validateInputs() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {
            showMessage('Por favor, insira seu email');
            return false;
        }

        if (!password) {
            showMessage('Por favor, insira sua senha');
            return false;
        }

        return true;
    }

    // EVENTO: Submissão do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateInputs()) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        setFormDisabled(true);

        // Fazer login
        const result = await auth.login(email, password);

        if (result.success) {
            // Salvar email se "Lembrar-me" estiver marcado
            if (rememberCheckbox.checked) {
                localStorage.setItem('solarmap_email', email);
            } else {
                localStorage.removeItem('solarmap_email');
            }

            showMessage('✅ ' + result.message, 'success');

            // Redirecionar após 1 segundo
            setTimeout(() => {
                // Verificar se há um parâmetro de redirecionamento
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                if (redirectUrl) {
                    // Decodificar e redirecionar para a página solicitada
                    window.location.href = decodeURIComponent(redirectUrl);
                } else {
                    // Redirecionar para página padrão (mapa)
                    window.location.href = 'mapa.html';
                }
            }, 1000);
        } else {
            showMessage('❌ ' + result.message, 'error');
            setFormDisabled(false);
        }
    });

    //EVENTO: Link "Esqueceu a senha?"
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            showMessage('Por favor, insira seu email primeiro', 'error');
            return;
        }

        setFormDisabled(true);
        const result = await auth.resetPassword(email);

        if (result.success) {
            showMessage('✅ ' + result.message, 'success');
        } else {
            showMessage('❌ ' + result.message, 'error');
        }

        setFormDisabled(false);
    });

    console.log('✅ Página de login inicializada');
});
