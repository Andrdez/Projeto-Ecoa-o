<?php
//encerra a sessão (botão "Sair").
require __DIR__ . '/../comum/funcoes.php';

if (metodo() !== 'POST') {
    erro('Método não permitido.', 405);
}

$_SESSION = [];
session_destroy();

responder(['ok' => true, 'mensagem' => 'Sessão encerrada.']);
