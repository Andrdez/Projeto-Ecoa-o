<?php
// Conexão com o banco de dados MySQL.

const DB_HOST    = 'localhost';
const DB_NOME    = 'ecoacao';
const DB_USUARIO = 'root';
const DB_SENHA   = 'root';

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NOME . ';charset=utf8mb4',
        DB_USUARIO,
        DB_SENHA,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // erros viram exceções
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // linhas como array associativo
            PDO::ATTR_EMULATE_PREPARES   => false,                  // números voltam como números
        ]
    );
} catch (PDOException $e) {
    error_log($e->getMessage());
    erro('Não foi possível conectar ao banco de dados. Confira o arquivo comum/conexao.php.', 500);
}
