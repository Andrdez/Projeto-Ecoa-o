// ===== Página de login =====
// Precisa de ../comum/comum.js carregado antes.

const aviso = document.getElementById('mensagem');

const formLogin = document.getElementById('form-login');

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderAviso(aviso);

    const dados = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };

    const botao = formLogin.querySelector('button[type="submit"]');
    botao.disabled = true;

    const resposta = await api('login.php', 'POST', dados);

    if (resposta.ok) {
        // O servidor diz para onde ir, conforme o tipo de conta
        window.location.href = resposta.dados.destino;
    } else {
        mostrarAviso(aviso, resposta.dados.mensagem, false);
        botao.disabled = false;
    }
});
