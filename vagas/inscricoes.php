<?php
// Inscrições em vagas de voluntariado (tabela Inscricao).
//   POST   {id_vaga}     -> o usuário logado se inscreve
//   DELETE ?id_vaga=     -> o usuário logado cancela a própria inscrição
//   GET    ?id_vaga=     -> lista de inscritos (dono da vaga ou admin)
require __DIR__ . '/../comum/funcoes.php';

switch (metodo()) {
    case 'POST':   inscrever();       break;
    case 'DELETE': cancelar();        break;
    case 'GET':    listarInscritos(); break;
    default:       erro('Método não permitido.', 405);
}

function inscrever(): void {
    global $pdo;

    $usuario = exigirLogin();
    $dados = lerCorpo();
    $idVaga = (int) ($dados['id_vaga'] ?? 0);

    $stmt = $pdo->prepare('SELECT Vagas AS num_vagas FROM Voluntario WHERE ID_Voluntario = ?');
    $stmt->execute([$idVaga]);
    $vaga = $stmt->fetch();
    if (!$vaga) {
        erro('Vaga não encontrada.', 404);
    }

    // Já está inscrito?
    $stmt = $pdo->prepare('SELECT 1 FROM Inscricao
                           WHERE FK_Usuario_ID_Usuario = ? AND FK_Voluntario_ID_Voluntario = ?');
    $stmt->execute([$usuario['id_usuario'], $idVaga]);
    if ($stmt->fetch()) {
        erro('Você já está inscrito nesta vaga.', 409);
    }

    // Ainda há lugar?
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM Inscricao WHERE FK_Voluntario_ID_Voluntario = ?');
    $stmt->execute([$idVaga]);
    if ((int) $stmt->fetchColumn() >= (int) $vaga['num_vagas']) {
        erro('Não há mais vagas disponíveis nesta ação.', 409);
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO Inscricao (FK_Usuario_ID_Usuario, FK_Voluntario_ID_Voluntario) VALUES (?, ?)');
        $stmt->execute([$usuario['id_usuario'], $idVaga]);
    } catch (PDOException $e) {
        // A chave única (usuário + vaga) também impede inscrição dupla
        if ($e->getCode() === '23000') {
            erro('Você já está inscrito nesta vaga.', 409);
        }
        throw $e;
    }

    responder(['ok' => true, 'mensagem' => 'Inscrição realizada! Nos vemos lá.'], 201);
}

function cancelar(): void {
    global $pdo;

    $usuario = exigirLogin();
    $idVaga = (int) ($_GET['id_vaga'] ?? 0);

    $stmt = $pdo->prepare('DELETE FROM Inscricao
                           WHERE FK_Usuario_ID_Usuario = ? AND FK_Voluntario_ID_Voluntario = ?');
    $stmt->execute([$usuario['id_usuario'], $idVaga]);
    if ($stmt->rowCount() === 0) {
        erro('Você não está inscrito nesta vaga.', 404);
    }

    responder(['ok' => true, 'mensagem' => 'Inscrição cancelada.']);
}

function listarInscritos(): void {
    global $pdo;

    $usuario = exigirTipo(['ong', 'admin']);
    $idVaga = (int) ($_GET['id_vaga'] ?? 0);
    vagaPermitida($usuario, $idVaga); // ONG só vê inscritos das próprias vagas

    $stmt = $pdo->prepare('SELECT u.Nome AS nome, u.Email AS email, i.Data_Inscricao AS data_inscricao
                           FROM Inscricao i
                           JOIN Usuario u ON u.Id_Usuario = i.FK_Usuario_ID_Usuario
                           WHERE i.FK_Voluntario_ID_Voluntario = ?
                           ORDER BY i.Data_Inscricao, i.ID_Inscricao');
    $stmt->execute([$idVaga]);

    responder(['ok' => true, 'inscritos' => $stmt->fetchAll()]);
}
