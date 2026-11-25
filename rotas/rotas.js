// ===== Rotas de coleta de lixo =====

const corpoTabela = document.getElementById('corpo-tabela');
const filtroBairro = document.getElementById('filtro-bairro');
const filtroTipo = document.getElementById('filtro-tipo');
const avisoRotas = document.getElementById('mensagem');
const formRota = document.getElementById('form-rota');
const botaoCancelarRota = document.getElementById('cancelar-edicao');

let rotas = [];       // todas as rotas vindas da API
let ehAdmin = false;  // só o admin vê os botões de gerenciar

// ---------- Tabela e filtros ----------

function desenharTabela() {
    const bairro = filtroBairro.value;
    const tipo = filtroTipo.value;

    // Filtra pelo bairro e pelo tipo escolhidos (vazio = todos)
    const filtradas = rotas.filter((rota) =>
        (bairro === '' || rota.bairro === bairro) && (tipo === '' || rota.tipo_coleta === tipo)
    );

    const colunas = ehAdmin ? 6 : 5;

    if (filtradas.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="${colunas}" class="tabela-vazia">Nenhuma rota encontrada para esse filtro.</td></tr>`;
        return;
    }

    corpoTabela.innerHTML = filtradas.map((rota) => `
        <tr>
            <td><strong>${escapar(rota.bairro)}</strong></td>
            <td><span class="tag tag-${rota.tipo_coleta}">${NOME_TIPO_COLETA[rota.tipo_coleta]}</span></td>
            <td>${escapar(rota.dia_semana)}</td>
            <td>${rota.horario}</td>
            <td>${escapar(rota.ponto_referencia)}</td>
            ${ehAdmin ? `<td class="acoes-tabela">
                <button type="button" class="botao botao-secundario" data-acao="editar" data-id="${rota.id_rota}">Editar</button>
                <button type="button" class="botao botao-perigo" data-acao="excluir" data-id="${rota.id_rota}">Excluir</button>
            </td>` : ''}
        </tr>`).join('');
}

// Preenche a lista de bairros do filtro (sem repetir) e mantém a escolha atual
function atualizarBairros() {
    const escolhido = filtroBairro.value;
    const bairros = [...new Set(rotas.map((rota) => rota.bairro))].sort();

    filtroBairro.innerHTML = '<option value="">Todos os bairros</option>' +
        bairros.map((b) => `<option value="${escapar(b)}">${escapar(b)}</option>`).join('');

    filtroBairro.value = bairros.includes(escolhido) ? escolhido : '';
}

async function carregarRotas() {
    const resposta = await api('rotas.php');

    if (!resposta.ok) {
        mostrarAviso(avisoRotas, resposta.dados.mensagem, false);
        return;
    }

    rotas = resposta.dados.rotas;
    atualizarBairros();
    desenharTabela();
}

filtroBairro.addEventListener('change', desenharTabela);
filtroTipo.addEventListener('change', desenharTabela);

// ---------- Gerenciar (somente admin) ----------

function limparFormulario() {
    formRota.reset();
    document.getElementById('id_rota').value = '';
    document.getElementById('titulo-form').innerHTML = '<i class="bi bi-plus-circle" aria-hidden="true"></i> Nova rota';
    document.getElementById('botao-salvar').textContent = 'Cadastrar rota';
    botaoCancelarRota.hidden = true;
}

botaoCancelarRota.addEventListener('click', limparFormulario);

formRota.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderAviso(avisoRotas);

    const id = document.getElementById('id_rota').value;
    const dados = {
        bairro: document.getElementById('bairro').value,
        tipo_coleta: document.getElementById('tipo_coleta').value,
        dia_semana: document.getElementById('dia_semana').value,
        horario: document.getElementById('horario').value,
        ponto_referencia: document.getElementById('ponto_referencia').value
    };

    const resposta = id
        ? await api('rotas.php?id=' + id, 'PUT', dados)
        : await api('rotas.php', 'POST', dados);

    if (resposta.ok) {
        mostrarAviso(avisoRotas, resposta.dados.mensagem, true);
        limparFormulario();
        carregarRotas();
    } else {
        tratarErro(resposta, avisoRotas);
    }
});

corpoTabela.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) {
        return;
    }

    const id = botao.dataset.id;
    esconderAviso(avisoRotas);

    if (botao.dataset.acao === 'editar') {
        const rota = rotas.find((r) => r.id_rota === Number(id));
        document.getElementById('id_rota').value = rota.id_rota;
        document.getElementById('bairro').value = rota.bairro;
        document.getElementById('tipo_coleta').value = rota.tipo_coleta;
        document.getElementById('dia_semana').value = rota.dia_semana;
        document.getElementById('horario').value = rota.horario;
        document.getElementById('ponto_referencia').value = rota.ponto_referencia;

        document.getElementById('titulo-form').innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editando rota';
        document.getElementById('botao-salvar').textContent = 'Salvar alterações';
        botaoCancelarRota.hidden = false;
        formRota.scrollIntoView();
    }

    if (botao.dataset.acao === 'excluir') {
        if (!confirm('Excluir esta rota de coleta?')) {
            return;
        }
        const resposta = await api('rotas.php?id=' + id, 'DELETE');
        if (resposta.ok) {
            mostrarAviso(avisoRotas, resposta.dados.mensagem, true);
            carregarRotas();
        } else {
            tratarErro(resposta, avisoRotas);
        }
    }
});

// ---------- Início ----------

async function iniciar() {
    const usuario = await iniciarPagina();
    ehAdmin = usuario !== null && usuario.tipo === 'admin';

    if (ehAdmin) {
        // Mostra o formulário e a coluna "Ações" (a permissão real é checada no back-end)
        formRota.hidden = false;
        document.getElementById('coluna-acoes').hidden = false;
    }

    carregarRotas();
}

iniciar();
