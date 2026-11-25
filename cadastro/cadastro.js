
const aviso = document.getElementById('mensagem');

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // não recarrega a página
    esconderAviso(aviso);

    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        confirmar_senha: document.getElementById('confirmar-senha').value,
        tipo: document.getElementById('tipo').value
    };

    // Confere antes de enviar (o servidor confere de novo)
    if (dados.senha !== dados.confirmar_senha) {
        mostrarAviso(aviso, 'As senhas não coincidem.', false);
        return;
    }

    const botao = formCadastro.querySelector('button[type="submit"]');
    botao.disabled = true;

    const resposta = await api('cadastro.php', 'POST', dados);

    if (resposta.ok) {
        mostrarAviso(aviso, resposta.dados.mensagem, true);
        // Leva para o login
        setTimeout(() => { window.location.href = '../login/login.html'; }, 1500);
    } else {
        mostrarAviso(aviso, resposta.dados.mensagem, false);
        botao.disabled = false;
    }
});
