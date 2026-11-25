<?php
// Postagens da comunidade (tabela Postagem).
//   GET    -> lista as postagens (público)
//   POST   -> publica (usuário logado). O título é opcional
//   DELETE -> exclui ?id= (o autor ou o admin)
require __DIR__ . '/../comum/funcoes.php';

switch (metodo()) {
    case 'GET':    listarPostagens();  break;
    case 'POST':   criarPostagem();    break;
    case 'DELETE': excluirPostagem();  break;
    default:       erro('Método não permitido.', 405);
}

function listarPostagens(): void {
    global $pdo;

    // Os apelidos (AS) mantêm os nomes que o JavaScript do site já usa
    $stmt = $pdo->query('SELECT p.ID_Postagem AS id_postagem, p.FK_Usuario_ID_Usuario AS id_usuario,
                                p.Titulo AS titulo, p.Descricao AS texto, p.`Data` AS criado_em,
                                u.Nome AS autor, u.Tipo AS autor_tipo
                         FROM Postagem p
                         JOIN Usuario u ON u.Id_Usuario = p.FK_Usuario_ID_Usuario
                         ORDER BY p.`Data` DESC, p.ID_Postagem DESC');

    responder(['ok' => true, 'postagens' => $stmt->fetchAll()]);
}

function criarPostagem(): void {
    global $pdo;

    $usuario = exigirLogin();
    $dados = lerCorpo();
    $texto = campo($dados, 'texto');
    $titulo = campo($dados, 'titulo');

    if ($texto === '') {
        erro('Escreva algo antes de publicar.', 422);
    }
    if (mb_strlen($texto) > 1000) {
        erro('A publicação pode ter no máximo 1000 caracteres.', 422);
    }
    if (mb_strlen($titulo) > 100) {
        erro('O título pode ter no máximo 100 caracteres.', 422);
    }

    // A data e a hora são preenchidas pelo banco (DEFAULT CURRENT_TIMESTAMP)
    $stmt = $pdo->prepare('INSERT INTO Postagem (FK_Usuario_ID_Usuario, Titulo, Descricao) VALUES (?, ?, ?)');
    $stmt->execute([$usuario['id_usuario'], $titulo === '' ? null : $titulo, $texto]);

    responder(['ok' => true, 'mensagem' => 'Publicação enviada!'], 201);
}

function excluirPostagem(): void {
    global $pdo;

    $usuario = exigirLogin();
    $id = (int) ($_GET['id'] ?? 0);

    $stmt = $pdo->prepare('SELECT FK_Usuario_ID_Usuario AS id_usuario FROM Postagem WHERE ID_Postagem = ?');
    $stmt->execute([$id]);
    $postagem = $stmt->fetch();
    if (!$postagem) {
        erro('Publicação não encontrada.', 404);
    }

    // Só o autor ou o admin podem excluir
    if ($usuario['tipo'] !== 'admin' && (int) $postagem['id_usuario'] !== (int) $usuario['id_usuario']) {
        erro('Você só pode excluir as suas próprias publicações.', 403);
    }

    // Os comentários dessa postagem são apagados junto (ON DELETE CASCADE)
    $stmt = $pdo->prepare('DELETE FROM Postagem WHERE ID_Postagem = ?');
    $stmt->execute([$id]);

    responder(['ok' => true, 'mensagem' => 'Publicação excluída.']);
}
