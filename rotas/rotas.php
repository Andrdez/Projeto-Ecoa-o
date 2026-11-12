<?php
// Rotas de coleta de lixo (tabela Rotas).
//   GET    -> lista as rotas (público)
//   POST   -> cria rota          (somente admin)
//   PUT    -> edita rota ?id=    (somente admin)
//   DELETE -> exclui rota ?id=   (somente admin)
require __DIR__ . '/../comum/funcoes.php';

const TIPOS_COLETA = ['organico', 'reciclavel', 'seletiva'];
const DIAS_SEMANA  = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

switch (metodo()) {
    case 'GET':    listarRotas();  break;
    case 'POST':   criarRota();    break;
    case 'PUT':    editarRota();   break;
    case 'DELETE': excluirRota();  break;
    default:       erro('Método não permitido.', 405);
}

function listarRotas(): void {
    global $pdo;

    // A ordem do ENUM já segue a semana (segunda a domingo).
    // Os apelidos (AS) mantêm os nomes que o JavaScript do site já usa.
    $stmt = $pdo->query("SELECT ID_Rota AS id_rota, Bairro AS bairro, Tipo_Residuo AS tipo_coleta,
                                Dia_Semana AS dia_semana, TIME_FORMAT(Horario_Coleta, '%H:%i') AS horario,
                                Ponto_Referencia AS ponto_referencia
                         FROM Rotas
                         ORDER BY Bairro, Dia_Semana, Horario_Coleta");

    responder(['ok' => true, 'rotas' => $stmt->fetchAll()]);
}

// Valida os campos da rota (usado ao criar e ao editar)
function lerRota(): array {
    $dados = lerCorpo();
    $rota = [
        'bairro'           => campo($dados, 'bairro'),
        'tipo_coleta'      => campo($dados, 'tipo_coleta'),
        'dia_semana'       => campo($dados, 'dia_semana'),
        'horario'          => campo($dados, 'horario'),
        'ponto_referencia' => campo($dados, 'ponto_referencia'),
    ];

    if (in_array('', $rota, true)) {
        erro('Preencha todos os campos da rota.', 422);
    }
    if (mb_strlen($rota['bairro']) > 100 || mb_strlen($rota['ponto_referencia']) > 200) {
        erro('Algum campo ultrapassou o tamanho máximo permitido.', 422);
    }
    if (!in_array($rota['tipo_coleta'], TIPOS_COLETA, true)) {
        erro('Tipo de coleta inválido.', 422);
    }
    if (!in_array($rota['dia_semana'], DIAS_SEMANA, true)) {
        erro('Dia da semana inválido.', 422);
    }
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $rota['horario'])) {
        erro('Horário inválido. Use o formato HH:MM.', 422);
    }
    return $rota;
}

function criarRota(): void {
    global $pdo;

    exigirTipo(['admin']);
    $r = lerRota();

    $stmt = $pdo->prepare('INSERT INTO Rotas (Bairro, Tipo_Residuo, Dia_Semana, Horario_Coleta, Ponto_Referencia)
                           VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$r['bairro'], $r['tipo_coleta'], $r['dia_semana'], $r['horario'], $r['ponto_referencia']]);

    responder(['ok' => true, 'mensagem' => 'Rota cadastrada com sucesso!'], 201);
}

function editarRota(): void {
    global $pdo;

    exigirTipo(['admin']);
    $id = (int) ($_GET['id'] ?? 0);
    $r = lerRota();

    $stmt = $pdo->prepare('UPDATE Rotas
                           SET Bairro = ?, Tipo_Residuo = ?, Dia_Semana = ?, Horario_Coleta = ?, Ponto_Referencia = ?
                           WHERE ID_Rota = ?');
    $stmt->execute([$r['bairro'], $r['tipo_coleta'], $r['dia_semana'], $r['horario'], $r['ponto_referencia'], $id]);

    // rowCount pode ser 0 se nada mudou; por isso confere se a rota existe
    $stmt = $pdo->prepare('SELECT 1 FROM Rotas WHERE ID_Rota = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        erro('Rota não encontrada.', 404);
    }

    responder(['ok' => true, 'mensagem' => 'Rota atualizada com sucesso!']);
}

function excluirRota(): void {
    global $pdo;

    exigirTipo(['admin']);
    $id = (int) ($_GET['id'] ?? 0);

    $stmt = $pdo->prepare('DELETE FROM Rotas WHERE ID_Rota = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        erro('Rota não encontrada.', 404);
    }

    responder(['ok' => true, 'mensagem' => 'Rota excluída.']);
}
