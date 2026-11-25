<?php
// Gerenciamento de usuários (somente admin).
//   GET    -> lista os usuários
//   PUT    -> altera o tipo ?id=  {tipo}
//   DELETE -> exclui o usuário ?id=
require __DIR__ . '/../comum/funcoes.php';

$admin = exigirTipo(['admin']); // todas as ações desta rota são só do admin

switch (metodo()) {
    case 'GET':    listarUsuarios();                  break;
    case 'PUT':    alterarTipo($admin);               break;
    case 'DELETE': excluirUsuario($admin);            break;
    default:       erro('Método não permitido.', 405);
}

function listarUsuarios(): void {
    global $pdo;

    // Os apelidos (AS) mantêm os nomes que o JavaScript do site já usa
    $stmt = $pdo->query('SELECT Id_Usuario AS id_usuario, Nome AS nome, Email AS email, Tipo AS tipo, Criado_Em AS criado_em
                         FROM Usuario ORDER BY Nome');
    responder(['ok' => true, 'usuarios' => $stmt->fetchAll()]);
}

function alterarTipo(array $admin): void {
    global $pdo;

    $id = (int) ($_GET['id'] ?? 0);
    $tipo = campo(lerCorpo(), 'tipo');

    if (!in_array($tipo, ['padrao', 'ong', 'admin'], true)) {
        erro('Tipo de conta inválido.', 422);
    }
    // Evita que o admin se tranque para fora do sistema
    if ($id === (int) $admin['id_usuario']) {
        erro('Você não pode alterar o tipo da sua própria conta.', 409);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM Usuario WHERE Id_Usuario = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        erro('Usuário não encontrado.', 404);
    }

    $stmt = $pdo->prepare('UPDATE Usuario SET Tipo = ? WHERE Id_Usuario = ?');
    $stmt->execute([$tipo, $id]);

    responder(['ok' => true, 'mensagem' => 'Tipo de conta atualizado.']);
}

function excluirUsuario(array $admin): void {
    global $pdo;

    $id = (int) ($_GET['id'] ?? 0);

    if ($id === (int) $admin['id_usuario']) {
        erro('Você não pode excluir a sua própria conta.', 409);
    }

    // Vagas, inscrições, postagens e comentários do usuário são apagados junto
    $stmt = $pdo->prepare('DELETE FROM Usuario WHERE Id_Usuario = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        erro('Usuário não encontrado.', 404);
    }

    responder(['ok' => true, 'mensagem' => 'Usuário excluído.']);
}
