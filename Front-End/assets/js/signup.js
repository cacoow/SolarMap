/*
    Lógica da Página de Cadastro
    Gerencia criação de nova conta no Supabase
*/

document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar Supabase estar disponível
    let tentativas = 0;
    while (!window.supabase && tentativas < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
    }

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
        window.location.href = 'mapa.html';
    }

    // Elementos do DOM
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const companyInput = document.getElementById('company');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const termsCheckbox = document.getElementById('terms');
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    const messageDiv = document.getElementById('message');


    //Exibir mensagem ao usuário
    function showMessage(message, type = 'error') {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }

    //Desabilitar/Habilitar formulário
    function setFormDisabled(disabled) {
        signupBtn.disabled = disabled;
        fullNameInput.disabled = disabled;
        emailInput.disabled = disabled;
        companyInput.disabled = disabled;
        passwordInput.disabled = disabled;
        passwordConfirmInput.disabled = disabled;
        termsCheckbox.disabled = disabled;
        signupBtnText.textContent = disabled ? 'Criando conta...' : 'Criar Conta';
    }

    //Validar inputs do formulário
    function validateInputs() {
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        // Nome completo
        if (!fullName) {
            showMessage('Por favor, insira seu nome completo');
            return false;
        }

        if (fullName.length < 3) {
            showMessage('Nome deve ter pelo menos 3 caracteres');
            return false;
        }

        // Email
        if (!email) {
            showMessage('Por favor, insira seu email');
            return false;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, insira um email válido');
            return false;
        }

        // Senha
        if (!password) {
            showMessage('Por favor, insira uma senha');
            return false;
        }

        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        // Confirmar senha
        if (!passwordConfirm) {
            showMessage('Por favor, confirme sua senha');
            return false;
        }

        if (password !== passwordConfirm) {
            showMessage('As senhas não correspondem');
            return false;
        }

        // Termos
        if (!termsCheckbox.checked) {
            showMessage('Você deve concordar com os Termos de Serviço');
            return false;
        }

        return true;
    }

    //EVENTO: Submissão do formulário de cadastro
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateInputs()) return;

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const company = companyInput.value.trim();
        const password = passwordInput.value;

        setFormDisabled(true);

        // Dados do usuário
        const userData = {
            email: email,
            full_name: fullName,
            company: company || 'Não informado'
        };

        // Fazer cadastro
        const result = await auth.signup(email, password, userData);

        if (result.success) {
            showMessage(
                '✅ Conta criada com sucesso! Verifique seu email para confirmar seu cadastro.',
                'success'
            );

            // Limpar formulário
            signupForm.reset();

            // Redirecionar após 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showMessage('❌ ' + result.message, 'error');
            setFormDisabled(false);
        }
    });

    console.log('✅ Página de cadastro inicializada');
});
