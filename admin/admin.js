const conteudoAdmin = document.getElementById('conteudo');
const avisoAdmin = document.getElementById('mensagem');
const corpoUsuarios = document.getElementById('corpo-usuarios');
let idDoAdmin = 0;

async function carregarUsuarios() {
    const resposta = await api('usuarios.php');

    if (!resposta.ok) {
        tratarErro(resposta, avisoAdmin);
        return;
    }

    corpoUsuarios.innerHTML = resposta.dados.usuarios.map((usuario) => {
        const ehVoce = usuario.id_usuario === idDoAdmin;

        // admin não altera nem exclui a própria conta
        const seletor = `
            <select data-id="${usuario.id_usuario}" aria-label="Tipo de conta de ${escapar(usuario.nome)}" ${ehVoce ? 'disabled' : ''}>
                <option value="padrao" ${usuario.tipo === 'padrao' ? 'selected' : ''}>Usuário padrão</option>
                <option value="ong" ${usuario.tipo === 'ong' ? 'selected' : ''}>ONG</option>
                <option value="admin" ${usuario.tipo === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>`;

        const excluir = ehVoce
            ? '<small>(você)</small>'
            : `<button type="button" class="botao botao-perigo" data-excluir="${usuario.id_usuario}">
                   <i class="bi bi-trash" aria-hidden="true"></i> Excluir</button>`;

        return `
            <tr>
                <td><strong>${escapar(usuario.nome)}</strong></td>
                <td>${escapar(usuario.email)}</td>
                <td>${seletor}</td>
                <td>${formatarDataHora(usuario.criado_em)}</td>
                <td class="acoes-tabela">${excluir}</td>
            </tr>`;
    }).join('');
}

// Alterar o tipo: acontece assim que o admin escolhe outra opção
corpoUsuarios.addEventListener('change', async (evento) => {
    const seletor = evento.target.closest('select[data-id]');
    if (!seletor) {
        return;
    }

    esconderAviso(avisoAdmin);
    const resposta = await api('usuarios.php?id=' + seletor.dataset.id, 'PUT', { tipo: seletor.value });

    if (resposta.ok) {
        mostrarAviso(avisoAdmin, resposta.dados.mensagem, true);
    } else {
        tratarErro(resposta, avisoAdmin);
    }
    carregarUsuarios();
});

// Excluir usuário
corpoUsuarios.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-excluir]');
    if (!botao) {
        return;
    }
    if (!confirm('Excluir este usuário? Vagas, inscrições e postagens dele também serão apagadas.')) {
        return;
    }

    esconderAviso(avisoAdmin);
    const resposta = await api('usuarios.php?id=' + botao.dataset.excluir, 'DELETE');

    if (resposta.ok) {
        mostrarAviso(avisoAdmin, resposta.dados.mensagem, true);
    } else {
        tratarErro(resposta, avisoAdmin);
    }
    carregarUsuarios();
});

async function iniciar() {
    const usuario = await iniciarPagina();

    if (!usuario) {
        window.location.href = '../login/login.html';
        return;
    }

    // Esconder a página é só visual: a API também recusa quem não é admin (erro 403)
    if (usuario.tipo !== 'admin') {
        mostrarAviso(avisoAdmin, 'Você não tem permissão para acessar esta página.', false);
        return;
    }

    idDoAdmin = usuario.id_usuario;
    conteudoAdmin.hidden = false;
    carregarUsuarios();
}

iniciar();
