<?php
// Funções comuns a todas as rotas da API (resposta JSON, sessão e permissões).

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

// Cookie da sessão
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();

// Envia uma resposta em JSON e encerra a execução
function responder(array $dados, int $codigo = 200): void {
    http_response_code($codigo);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// Atalho para respostas de erro
function erro(string $mensagem, int $codigo = 400): void {
    responder(['ok' => false, 'mensagem' => $mensagem], $codigo);
}

// Qualquer erro inesperado vira uma resposta JSON amigável (sem mostrar detalhes)
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    erro('Erro interno do servidor. Tente novamente mais tarde.', 500);
});

require __DIR__ . '/conexao.php';

// ---------- Entrada de dados ----------
function metodo(): string {
    return $_SERVER['REQUEST_METHOD'];
}

// Lê o corpo JSON enviado pelo JavaScript.
function lerCorpo(): array {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        erro('Requisição inválida.', 415);
    }
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

// Pega um campo de texto do corpo, sem espaços nas pontas
function campo(array $dados, string $nome): string {
    $valor = $dados[$nome] ?? '';
    return is_string($valor) ? trim($valor) : '';
}

// ---------- Sessão e permissões ----------

// Devolve o usuário logado (lido do banco a cada requisição) ou null.
// Assim, se o admin mudar o tipo de alguém ou excluir a conta, funciona na hora.
function usuarioLogado(): ?array {
    global $pdo;
    static $usuario = false;
    if ($usuario !== false) {
        return $usuario;
    }
    $usuario = null;
    if (!empty($_SESSION['id_usuario'])) {
        // Os apelidos (AS) mantêm os nomes que o JavaScript do site já usa
        $stmt = $pdo->prepare('SELECT Id_Usuario AS id_usuario, Nome AS nome, Email AS email, Tipo AS tipo
                               FROM Usuario WHERE Id_Usuario = ?');
        $stmt->execute([$_SESSION['id_usuario']]);
        $usuario = $stmt->fetch() ?: null;
    }
    return $usuario;
}

// Exige usuário logado; senão responde 401
function exigirLogin(): array {
    $usuario = usuarioLogado();
    if ($usuario === null) {
        erro('Você precisa entrar na sua conta para continuar.', 401);
    }
    return $usuario;
}

// Exige que o usuário seja de um dos tipos informados; senão responde 403
function exigirTipo(array $tipos): array {
    $usuario = exigirLogin();
    if (!in_array($usuario['tipo'], $tipos, true)) {
        erro('Você não tem permissão para realizar esta ação.', 403);
    }
    return $usuario;
}

// Busca uma vaga e confere se o usuário pode mexer nela
function vagaPermitida(array $usuario, int $idVaga): array {
    global $pdo;
    $stmt = $pdo->prepare('SELECT ID_Voluntario AS id_vaga, FK_Usuario_ID_Usuario AS id_ong
                           FROM Voluntario WHERE ID_Voluntario = ?');
    $stmt->execute([$idVaga]);
    $vaga = $stmt->fetch();
    if (!$vaga) {
        erro('Vaga não encontrada.', 404);
    }
    if ($usuario['tipo'] !== 'admin' && (int) $vaga['id_ong'] !== (int) $usuario['id_usuario']) {
        erro('Você só pode alterar as vagas da sua própria ONG.', 403);
    }
    return $vaga;
}
