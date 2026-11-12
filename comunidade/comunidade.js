// ===== Comunidade (postagens) =====

const listaPosts = document.getElementById('lista-posts');
const formPost = document.getElementById('form-post');
const tituloPost = document.getElementById('titulo-post');
const textoPost = document.getElementById('texto-post');
const avisoPost = document.getElementById('mensagem');
let usuarioLogadoAtual = null;

// Selo ao lado do nome para ONGs e administradores
function seloDoAutor(tipo) {
    if (tipo === 'ong') {
        return '<span class="tag tag-ong">ONG</span>';
    }
    if (tipo === 'admin') {
        return '<span class="tag tag-admin">Admin</span>';
    }
    return '';
}

function htmlPostagem(post) {
    // O autor e o admin veem o botão de excluir
    const podeExcluir = usuarioLogadoAtual !== null &&
        (usuarioLogadoAtual.tipo === 'admin' || usuarioLogadoAtual.id_usuario === post.id_usuario);

    const botaoExcluir = podeExcluir
        ? `<div class="post-acoes">
               <button type="button" class="acao-post" data-id="${post.id_postagem}">
                   <i class="bi bi-trash" aria-hidden="true"></i> Excluir
               </button>
           </div>`
        : '';

    return `
        <article class="post">
            <div class="post-cabecalho">
                <div class="avatar" aria-hidden="true">${escapar(iniciais(post.autor))}</div>
                <div class="post-autor">
                    <strong>${escapar(post.autor)}</strong>
                    <small>${formatarDataHora(post.criado_em)}</small>
                </div>
                ${seloDoAutor(post.autor_tipo)}
            </div>
            ${post.titulo ? `<h3>${escapar(post.titulo)}</h3>` : ''}
            <p class="post-texto">${escapar(post.texto)}</p>
            ${botaoExcluir}
        </article>`;
}

async function carregarPosts() {
    const resposta = await api('postagens.php');

    if (!resposta.ok) {
        mostrarAviso(avisoPost, resposta.dados.mensagem, false);
        return;
    }

    const posts = resposta.dados.postagens;
    listaPosts.innerHTML = posts.length === 0
        ? '<p class="sem-posts">Nenhuma publicação ainda. Que tal ser a primeira pessoa a publicar?</p>'
        : posts.map(htmlPostagem).join('');
}

// Publicar
formPost.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderAviso(avisoPost);

    const resposta = await api('postagens.php', 'POST', {
        titulo: tituloPost.value,
        texto: textoPost.value
    });

    if (resposta.ok) {
        tituloPost.value = '';
        textoPost.value = '';
        mostrarAviso(avisoPost, resposta.dados.mensagem, true);
        carregarPosts();
    } else {
        tratarErro(resposta, avisoPost);
    }
});

// Excluir
listaPosts.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('button[data-id]');
    if (!botao || !confirm('Excluir esta publicação?')) {
        return;
    }

    esconderAviso(avisoPost);
    const resposta = await api('postagens.php?id=' + botao.dataset.id, 'DELETE');

    if (resposta.ok) {
        mostrarAviso(avisoPost, resposta.dados.mensagem, true);
        carregarPosts();
    } else {
        tratarErro(resposta, avisoPost);
        carregarPosts();
    }
});

async function iniciar() {
    usuarioLogadoAtual = await iniciarPagina();

    // Só quem está logado vê o campo de publicar; visitantes apenas leem
    if (usuarioLogadoAtual) {
        formPost.hidden = false;
    } else {
        document.getElementById('aviso-visitante').hidden = false;
    }

    carregarPosts();
}

iniciar();
