// ===== Painel de vagas (ONG: só as suas | admin: todas) =====

const conteudo = document.getElementById('conteudo');
const avisoPainel = document.getElementById('mensagem');
const listaPainel = document.getElementById('lista-vagas');
const formVaga = document.getElementById('form-vaga');
const botaoCancelarEdicao = document.getElementById('cancelar-edicao');

let vagas = []; // vagas carregadas (usadas ao clicar em "Editar")

// ---------- Lista de vagas ----------

function botoesDoPainel(vaga) {
    return `
        <button type="button" class="botao botao-secundario" data-acao="editar" data-id="${vaga.id_vaga}">
            <i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
        <button type="button" class="botao botao-secundario" data-acao="inscritos" data-id="${vaga.id_vaga}">
            <i class="bi bi-people" aria-hidden="true"></i> Inscritos (${vaga.inscritos})</button>
        <button type="button" class="botao botao-perigo" data-acao="excluir" data-id="${vaga.id_vaga}">
            <i class="bi bi-trash" aria-hidden="true"></i> Excluir</button>`;
}

async function carregarVagas() {
    const resposta = await api('../vagas/vagas.php?minhas=1');

    if (!resposta.ok) {
        tratarErro(resposta, avisoPainel);
        return;
    }

    vagas = resposta.dados.vagas;

    if (vagas.length === 0) {
        listaPainel.innerHTML = '<p class="sem-posts">Você ainda não criou nenhuma vaga. Use o formulário acima!</p>';
        return;
    }

    listaPainel.innerHTML = vagas.map((vaga) => htmlCartaoVaga(vaga, botoesDoPainel(vaga))).join('');
}

// ---------- Formulário (criar e editar) ----------

function limparFormulario() {
    formVaga.reset();
    document.getElementById('id_vaga').value = '';
    document.getElementById('titulo-form').innerHTML = '<i class="bi bi-plus-circle" aria-hidden="true"></i> Nova vaga';
    document.getElementById('botao-salvar').textContent = 'Criar vaga';
    botaoCancelarEdicao.hidden = true;
}

function preencherFormulario(vaga) {
    document.getElementById('id_vaga').value = vaga.id_vaga;
    document.getElementById('titulo').value = vaga.titulo;
    document.getElementById('descricao').value = vaga.descricao;
    document.getElementById('localizacao').value = vaga.localizacao;
    document.getElementById('data_vaga').value = vaga.data_vaga;
    document.getElementById('horario').value = vaga.horario || '';
    document.getElementById('num_vagas').value = vaga.num_vagas;

    document.getElementById('titulo-form').innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editando vaga';
    document.getElementById('botao-salvar').textContent = 'Salvar alterações';
    botaoCancelarEdicao.hidden = false;
    formVaga.scrollIntoView();
}

botaoCancelarEdicao.addEventListener('click', limparFormulario);

formVaga.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderAviso(avisoPainel);

    const id = document.getElementById('id_vaga').value;
    const dados = {
        titulo: document.getElementById('titulo').value,
        descricao: document.getElementById('descricao').value,
        localizacao: document.getElementById('localizacao').value,
        data_vaga: document.getElementById('data_vaga').value,
        horario: document.getElementById('horario').value,
        num_vagas: Number(document.getElementById('num_vagas').value)
    };

    // Com id = edita (PUT); sem id = cria (POST)
    const resposta = id
        ? await api('../vagas/vagas.php?id=' + id, 'PUT', dados)
        : await api('../vagas/vagas.php', 'POST', dados);

    if (resposta.ok) {
        mostrarAviso(avisoPainel, resposta.dados.mensagem, true);
        limparFormulario();
        carregarVagas();
    } else {
        tratarErro(resposta, avisoPainel);
    }
});

// ---------- Botões dos cartões ----------

listaPainel.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) {
        return;
    }

    const id = botao.dataset.id;
    esconderAviso(avisoPainel);

    if (botao.dataset.acao === 'editar') {
        preencherFormulario(vagas.find((vaga) => vaga.id_vaga === Number(id)));
    }

    if (botao.dataset.acao === 'excluir') {
        if (!confirm('Excluir esta vaga? As inscrições também serão apagadas.')) {
            return;
        }
        const resposta = await api('../vagas/vagas.php?id=' + id, 'DELETE');
        if (resposta.ok) {
            mostrarAviso(avisoPainel, resposta.dados.mensagem, true);
            carregarVagas();
        } else {
            tratarErro(resposta, avisoPainel);
        }
    }

    if (botao.dataset.acao === 'inscritos') {
        mostrarInscritos(id);
    }
});

// Abre/fecha a lista de inscritos dentro do cartão
async function mostrarInscritos(id) {
    const caixa = document.getElementById('inscritos-' + id);

    if (!caixa.hidden) {
        caixa.hidden = true; // segundo clique fecha
        return;
    }

    const resposta = await api('../vagas/inscricoes.php?id_vaga=' + id);
    if (!resposta.ok) {
        tratarErro(resposta, avisoPainel);
        return;
    }

    const inscritos = resposta.dados.inscritos;
    if (inscritos.length === 0) {
        caixa.innerHTML = 'Ninguém se inscreveu ainda.';
    } else {
        caixa.innerHTML = '<strong>Inscritos:</strong><ul>' + inscritos.map((pessoa) =>
            `<li>${escapar(pessoa.nome)} — ${escapar(pessoa.email)} <small>(${formatarDataHora(pessoa.data_inscricao)})</small></li>`
        ).join('') + '</ul>';
    }
    caixa.hidden = false;
}

// ---------- Início ----------

async function iniciar() {
    const usuario = await iniciarPagina();

    if (!usuario) {
        window.location.href = '../login/login.html';
        return;
    }

    // Esconder o painel é só visual: o back-end também confere a permissão
    if (usuario.tipo !== 'ong' && usuario.tipo !== 'admin') {
        mostrarAviso(avisoPainel, 'Você não tem permissão para acessar esta página.', false);
        return;
    }

    if (usuario.tipo === 'admin') {
        document.getElementById('titulo-pagina').innerHTML = 'Gerenciar <span>vagas</span>';
        document.getElementById('subtitulo-pagina').textContent = 'Como administrador, você vê e gerencia as vagas de todas as ONGs.';
    }

    conteudo.hidden = false;
    carregarVagas();
}

iniciar();
