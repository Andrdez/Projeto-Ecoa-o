<?php
// Vagas de voluntariado (tabela Voluntario).
//   GET    -> lista as vagas (público). Com ?minhas=1 (ONG/admin): só as da ONG, ou todas para o admin
//   POST   -> cria vaga (ONG ou admin)
//   PUT    -> edita vaga ?id=  (dono da vaga ou admin)
//   DELETE -> exclui vaga ?id= (dono da vaga ou admin)
require __DIR__ . '/../comum/funcoes.php';

switch (metodo()) {
    case 'GET':    listarVagas();  break;
    case 'POST':   criarVaga();    break;
    case 'PUT':    editarVaga();   break;
    case 'DELETE': excluirVaga();  break;
    default:       erro('Método não permitido.', 405);
}

function listarVagas(): void {
    global $pdo;

    $usuario = usuarioLogado();
    $idUsuario = $usuario['id_usuario'] ?? 0;

    // Traz a ONG responsável, quantos já se inscreveram e se o usuário atual está inscrito.
    // Os apelidos (AS) mantêm os nomes que o JavaScript do site já usa.
    $sql = "SELECT v.ID_Voluntario AS id_vaga, v.FK_Usuario_ID_Usuario AS id_ong,
                   v.Nome AS titulo, v.Descricao AS descricao, v.Locais AS localizacao,
                   v.`Data` AS data_vaga, TIME_FORMAT(v.Horario, '%H:%i') AS horario, v.Vagas AS num_vagas,
                   u.Nome AS ong_nome,
                   (SELECT COUNT(*) FROM Inscricao i
                     WHERE i.FK_Voluntario_ID_Voluntario = v.ID_Voluntario) AS inscritos,
                   (SELECT COUNT(*) FROM Inscricao i
                     WHERE i.FK_Voluntario_ID_Voluntario = v.ID_Voluntario
                       AND i.FK_Usuario_ID_Usuario = ?) AS inscrito
            FROM Voluntario v
            JOIN Usuario u ON u.Id_Usuario = v.FK_Usuario_ID_Usuario";
    $parametros = [$idUsuario];

    if (!empty($_GET['minhas'])) {
        $usuario = exigirTipo(['ong', 'admin']);
        if ($usuario['tipo'] === 'ong') {
            $sql .= ' WHERE v.FK_Usuario_ID_Usuario = ?';
            $parametros[] = $usuario['id_usuario'];
        }
    }

    $sql .= ' ORDER BY v.`Data`, v.ID_Voluntario';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);

    responder(['ok' => true, 'vagas' => $stmt->fetchAll()]);
}

// Valida os campos da vaga (usado ao criar e ao editar)
function lerVaga(): array {
    $dados = lerCorpo();
    $vaga = [
        'titulo'      => campo($dados, 'titulo'),
        'descricao'   => campo($dados, 'descricao'),
        'localizacao' => campo($dados, 'localizacao'),
        'data_vaga'   => campo($dados, 'data_vaga'),
        'horario'     => campo($dados, 'horario'),   // opcional
        'num_vagas'   => filter_var($dados['num_vagas'] ?? null, FILTER_VALIDATE_INT),
    ];

    if ($vaga['titulo'] === '' || $vaga['descricao'] === '' || $vaga['localizacao'] === ''
        || $vaga['data_vaga'] === '' || $vaga['num_vagas'] === false) {
        erro('Preencha todos os campos da vaga.', 422);
    }
    if (mb_strlen($vaga['titulo']) > 120 || mb_strlen($vaga['localizacao']) > 200 || mb_strlen($vaga['descricao']) > 1000) {
        erro('Algum campo ultrapassou o tamanho máximo permitido.', 422);
    }
    // A data precisa existir de verdade (formato AAAA-MM-DD)
    $data = DateTime::createFromFormat('Y-m-d', $vaga['data_vaga']);
    if (!$data || $data->format('Y-m-d') !== $vaga['data_vaga']) {
        erro('Data inválida.', 422);
    }
    // O horário é opcional; se vier, precisa estar no formato HH:MM
    if ($vaga['horario'] === '') {
        $vaga['horario'] = null;
    } elseif (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $vaga['horario'])) {
        erro('Horário inválido. Use o formato HH:MM.', 422);
    }
    if ($vaga['num_vagas'] < 1 || $vaga['num_vagas'] > 1000) {
        erro('O número de vagas deve ficar entre 1 e 1000.', 422);
    }
    return $vaga;
}

function criarVaga(): void {
    global $pdo;

    $usuario = exigirTipo(['ong', 'admin']);
    $vaga = lerVaga();

    // A vaga sempre pertence a quem a criou
    $stmt = $pdo->prepare('INSERT INTO Voluntario (FK_Usuario_ID_Usuario, Nome, Descricao, Locais, `Data`, Horario, Vagas)
                           VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$usuario['id_usuario'], $vaga['titulo'], $vaga['descricao'], $vaga['localizacao'],
                    $vaga['data_vaga'], $vaga['horario'], $vaga['num_vagas']]);

    responder(['ok' => true, 'mensagem' => 'Vaga criada com sucesso!'], 201);
}

function editarVaga(): void {
    global $pdo;

    $usuario = exigirTipo(['ong', 'admin']);
    $id = (int) ($_GET['id'] ?? 0);
    vagaPermitida($usuario, $id);
    $vaga = lerVaga();

    // Não deixa reduzir o número de vagas abaixo do total de inscritos
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM Inscricao WHERE FK_Voluntario_ID_Voluntario = ?');
    $stmt->execute([$id]);
    $inscritos = (int) $stmt->fetchColumn();
    if ($vaga['num_vagas'] < $inscritos) {
        erro("Já existem $inscritos inscritos: o número de vagas não pode ser menor que isso.", 422);
    }

    $stmt = $pdo->prepare('UPDATE Voluntario
                           SET Nome = ?, Descricao = ?, Locais = ?, `Data` = ?, Horario = ?, Vagas = ?
                           WHERE ID_Voluntario = ?');
    $stmt->execute([$vaga['titulo'], $vaga['descricao'], $vaga['localizacao'],
                    $vaga['data_vaga'], $vaga['horario'], $vaga['num_vagas'], $id]);

    responder(['ok' => true, 'mensagem' => 'Vaga atualizada com sucesso!']);
}

function excluirVaga(): void {
    global $pdo;

    $usuario = exigirTipo(['ong', 'admin']);
    $id = (int) ($_GET['id'] ?? 0);
    vagaPermitida($usuario, $id);

    // As inscrições dessa vaga são apagadas junto (ON DELETE CASCADE)
    $stmt = $pdo->prepare('DELETE FROM Voluntario WHERE ID_Voluntario = ?');
    $stmt->execute([$id]);

    responder(['ok' => true, 'mensagem' => 'Vaga excluída.']);
}
