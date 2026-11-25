<?php
// POST: confere e-mail e senha, cria a sessão e diz para onde redirecionar.
require __DIR__ . '/../comum/funcoes.php';

if (metodo() !== 'POST') {
    erro('Método não permitido.', 405);
}

$dados = lerCorpo();
$email = strtolower(campo($dados, 'email'));
$senha = is_string($dados['senha'] ?? null) ? $dados['senha'] : '';

if ($email === '' || $senha === '') {
    erro('Preencha o e-mail e a senha.', 422);
}

$stmt = $pdo->prepare('SELECT Id_Usuario AS id_usuario, Nome AS nome, Tipo AS tipo, Senha AS senha_hash
                       FROM Usuario WHERE Email = ?');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario) {
    erro('E-mail não cadastrado.', 401);
}
if (!password_verify($senha, $usuario['senha_hash'])) {
    erro('Senha incorreta.', 401);
}

// Login válido: troca o id da sessão (evita fixação de sessão) e guarda o usuário
session_regenerate_id(true);
$_SESSION['id_usuario'] = (int) $usuario['id_usuario'];

// Página inicial de cada tipo de conta
$destinos = [
    'padrao' => '../comunidade/comunidade.html',
    'ong'    => '../minhas-vagas/minhas-vagas.html',
    'admin'  => '../admin/admin.html',
];

responder([
    'ok'      => true,
    'mensagem' => 'Login realizado com sucesso!',
    'destino' => $destinos[$usuario['tipo']],
]);
