// Chama a API e devolve sempre { ok, status, dados }.
// Para POST, PUT e DELETE envia o corpo em JSON.
async function api(url, metodo = 'GET', corpo = null) {
    const opcoes = { method: metodo, headers: {} };

    if (metodo !== 'GET') {
        opcoes.headers['Content-Type'] = 'application/json';
        opcoes.body = JSON.stringify(corpo || {});
    }

    try {
        const resposta = await fetch(url, opcoes);
        const dados = await resposta.json();
        return { ok: resposta.ok, status: resposta.status, dados: dados };
    } catch (erro) {
        // Servidor desligado, PHP fora do ar ou página aberta direto do arquivo
        return {
            ok: false,
            status: 0,
            dados: { mensagem: 'Não foi possível conectar ao servidor. Abra o site por http://localhost.' }
        };
    }
}

// Troca caracteres especiais por texto seguro (evita injeção de HTML)
function escapar(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// "Reduz o nome"
function iniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0].charAt(0);
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primeira + ultima).toUpperCase();
}

// "arruma a data"
function formatarData(dataIso) {
    const [ano, mes, dia] = dataIso.split('-');
    return dia + '/' + mes + '/' + ano;
}

// Simplifica data e hora
function formatarDataHora(dataHora) {
    const [data, hora] = dataHora.split(' ');
    return formatarData(data) + ' às ' + hora.slice(0, 5);
}

// Mostra uma mensagem de sucesso (ok = true) ou de erro (ok = false)
function mostrarAviso(elemento, texto, ok) {
    elemento.textContent = texto;
    elemento.className = 'aviso ' + (ok ? 'aviso-ok' : 'aviso-erro');
    elemento.hidden = false;
}

function esconderAviso(elemento) {
    elemento.hidden = true;
}

// Mensagem de erro padrão para respostas da API.
// Se a sessão expirou (401), leva o usuário para o login.
function tratarErro(resposta, elemento) {
    if (resposta.status === 401) {
        window.location.href = '../login/login.html';
        return;
    }
    mostrarAviso(elemento, resposta.dados.mensagem || 'Ocorreu um erro inesperado.', false);
}

// Nomes para os tipos de conta e de coleta
const NOME_TIPO_CONTA = { padrao: 'Usuário', ong: 'ONG', admin: 'Admin' };
const NOME_TIPO_COLETA = { organico: 'Orgânico', reciclavel: 'Reciclável', seletiva: 'Seletiva' };

// Monta o HTML de um cartão de vaga. "botoes" é o HTML dos botões de cada página.
function htmlCartaoVaga(vaga, botoes) {
    const restantes = vaga.num_vagas - vaga.inscritos;
    const textoVagas = restantes > 0
        ? restantes + ' de ' + vaga.num_vagas + ' vagas disponíveis'
        : 'Vagas esgotadas (' + vaga.num_vagas + ')';

    return `
        <article class="card-vaga" id="vaga-${vaga.id_vaga}">
            <span class="vaga-ong"><i class="bi bi-building" aria-hidden="true"></i> ${escapar(vaga.ong_nome)}</span>
            <h3>${escapar(vaga.titulo)}</h3>
            <p>${escapar(vaga.descricao)}</p>
            <ul class="vaga-info">
                <li><i class="bi bi-geo-alt" aria-hidden="true"></i>${escapar(vaga.localizacao)}</li>
                <li><i class="bi bi-calendar-event" aria-hidden="true"></i>${formatarData(vaga.data_vaga)}${vaga.horario ? ' às ' + vaga.horario : ''}</li>
                <li><i class="bi bi-people" aria-hidden="true"></i>${textoVagas}</li>
            </ul>
            <div class="vaga-botoes">${botoes}</div>
            <div class="inscritos" id="inscritos-${vaga.id_vaga}" hidden></div>
        </article>`;
}


// Busca a sessão, monta o menu e devolve o usuário logado
async function iniciarPagina() {
    const resposta = await api('../comum/sessao.php');
    const usuario = resposta.dados.logado ? resposta.dados.usuario : null;
    montarMenu(usuario);
    return usuario;
}

function montarMenu(usuario) {
    // Visitantes mantêm os botões "Entrar" e "Cadastrar" que já estão no HTML
    if (!usuario) {
        return;
    }

    // Logado: "Olá, nome" + botão Sair
    const conta = document.getElementById('acoes-conta');
    conta.innerHTML = `
        <span class="saudacao">Olá, ${escapar(usuario.nome)}</span>
        <button type="button" class="botao botao-secundario" id="botao-sair">Sair</button>`;

    document.getElementById('botao-sair').addEventListener('click', async () => {
        await api('../comum/logout.php', 'POST');
        window.location.href = '../index/index.html';
    });

    // Link extra no menu conforme o tipo de conta
    const painel = {
        ong: { texto: 'Minhas vagas', pagina: 'minhas-vagas' },
        admin: { texto: 'Administração', pagina: 'admin' }
    }[usuario.tipo];

    if (painel) {
        const link = document.createElement('a');
        link.href = '../' + painel.pagina + '/' + painel.pagina + '.html';
        link.textContent = painel.texto;
        if (window.location.pathname.endsWith('/' + painel.pagina + '/' + painel.pagina + '.html')) {
            link.className = 'active';
        }
        document.querySelector('.cerebro nav').appendChild(link);
    }
}
