<?php
//informa se há alguém logado
require __DIR__ . '/../comum/funcoes.php';

$usuario = usuarioLogado();

responder([
    'ok'      => true,
    'logado'  => $usuario !== null,
    'usuario' => $usuario,
]);
