<?php
// POST: cria uma nova conta.
require __DIR__ . '/../comum/funcoes.php';

if (metodo() !== 'POST') {
    erro('Método não permitido.', 405);
}

$dados     = lerCorpo();
$nome      = campo($dados, 'nome');
$email     = strtolower(campo($dados, 'email'));
$tipo      = campo($dados, 'tipo');
$senha     = is_string($dados['senha'] ?? null) ? $dados['senha'] : '';
$confirmar = is_string($dados['confirmar_senha'] ?? null) ? $dados['confirmar_senha'] : '';

// Validações
if ($nome === '' || $email === '' || $senha === '' || $confirmar === '' || $tipo === '') {
    erro('Preencha todos os campos.', 422);
}
if (mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
    erro('O nome deve ter entre 2 e 100 caracteres.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    erro('Digite um e-mail válido.', 422);
}
if (strlen($senha) < 6) {
    erro('A senha deve ter pelo menos 6 caracteres.', 422);
}
if ($senha !== $confirmar) {
    erro('As senhas não coincidem.', 422);
}
// O tipo "admin" nunca pode ser criado
if (!in_array($tipo, ['padrao', 'ong'], true)) {
    erro('Tipo de conta inválido.', 422);
}

// E-mail já usado?
$stmt = $pdo->prepare('SELECT Id_Usuario FROM Usuario WHERE Email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    erro('Este e-mail já está cadastrado.', 409);
}

// A senha salva apenas o hash (bcrypt)
$hash = password_hash($senha, PASSWORD_DEFAULT);

try {
    // A coluna Senha guarda o hash
    $stmt = $pdo->prepare('INSERT INTO Usuario (Nome, Email, Senha, Tipo) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nome, $email, $hash, $tipo]);
} catch (PDOException $e) {
    // 23000 = dois cadastros iguais ao mesmo tempo
    if ($e->getCode() === '23000') {
        erro('Este e-mail já está cadastrado.', 409);
    }
    throw $e;
}

responder(['ok' => true, 'mensagem' => 'Cadastro realizado com sucesso! Agora é só entrar.'], 201);
