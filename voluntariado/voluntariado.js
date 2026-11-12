// ===== Página de voluntariado (lista de vagas) =====

const listaVagas = document.getElementById('lista-vagas');
const avisoVagas = document.getElementById('mensagem');
let usuarioAtual = null;

// Botão de cada cartão, conforme a situação da vaga e do usuário
function botaoDaVaga(vaga) {
    if (vaga.inscrito) {
        return `<button type="button" class="botao botao-secundario" data-acao="cancelar" data-id="${vaga.id_vaga}">
                    <i class="bi bi-x-circle" aria-hidden="true"></i> Cancelar inscrição</button>`;
    }
    if (vaga.inscritos >= vaga.num_vagas) {
        return `<button type="button" class="botao botao-secundario" disabled>Vagas esgotadas</button>`;
    }
    return `<button type="button" class="botao botao-principal" data-acao="inscrever" data-id="${vaga.id_vaga}">
                <i class="bi bi-hand-thumbs-up" aria-hidden="true"></i> Inscrever-se</button>`;
}

async function carregarVagas() {
    const resposta = await api('../vagas/vagas.php');

    if (!resposta.ok) {
        listaVagas.innerHTML = '';
        mostrarAviso(avisoVagas, resposta.dados.mensagem, false);
        return;
    }

    if (resposta.dados.vagas.length === 0) {
        listaVagas.innerHTML = '<p class="sem-posts">Nenhuma vaga disponível no momento.</p>';
        return;
    }

    listaVagas.innerHTML = resposta.dados.vagas
        .map((vaga) => htmlCartaoVaga(vaga, botaoDaVaga(vaga)))
        .join('');
}

// Um único "ouvinte" cuida de todos os botões dos cartões
listaVagas.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) {
        return;
    }

    // Visitante sem login é levado para a página de login
    if (!usuarioAtual) {
        window.location.href = '../login/login.html';
        return;
    }

    esconderAviso(avisoVagas);
    const id = botao.dataset.id;
    botao.disabled = true;

    const resposta = botao.dataset.acao === 'inscrever'
        ? await api('../vagas/inscricoes.php', 'POST', { id_vaga: Number(id) })
        : await api('../vagas/inscricoes.php?id_vaga=' + id, 'DELETE');

    if (resposta.ok) {
        mostrarAviso(avisoVagas, resposta.dados.mensagem, true);
    } else {
        tratarErro(resposta, avisoVagas);
    }
    carregarVagas(); // atualiza contagem de vagas e botões
});

async function iniciar() {
    usuarioAtual = await iniciarPagina();

    // ONG e admin ganham um atalho para o painel de vagas
    if (usuarioAtual && (usuarioAtual.tipo === 'ong' || usuarioAtual.tipo === 'admin')) {
        document.getElementById('atalho-painel').hidden = false;
    }

    carregarVagas();
}

iniciar();
