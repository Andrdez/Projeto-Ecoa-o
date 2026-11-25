-- =====================================================
--  Eco-Ação — Banco de dados (MySQL / MariaDB)
--  Script do PJBL3 ajustado para funcionar com o site.
--
--  ATENÇÃO: este script APAGA e recria o banco "ecoacao".
--  Pode ser executado várias vezes para "zerar" os dados de exemplo.
--
--  O que foi ajustado em relação ao script original (marcado com [AJUSTE]):
--   - Nome do banco sem acento (Ecoação -> ecoacao).
--   - Usuario: novos campos Email e Tipo; Senha maior (guarda o hash bcrypt);
--     CPF e Telefone como texto (INT não comporta 11 dígitos).
--   - Voluntario: agora pertence a uma ONG (usuário) e ganhou a tabela Inscricao.
--   - Rotas: ganhou Bairro e Dia_Semana (coleta semanal).
--   - Postagem: Data virou DATETIME (mostra a hora); colunas sem acento.
--   - ON DELETE CASCADE nas chaves de Usuario (permite excluir um usuário).
--   - ONGS: CNPJ e Telefone como texto, ID automático e ligação com o login da ONG.
--   - Tabelas que o site ainda não usa (Funcionario, Jogo, Pontuação, Coleta,
--     Projetos, Ponto_de_Coleta...) foram mantidas como estavam.
-- =====================================================

-- Garante que acentos (ç, ã, é...) sejam lidos corretamente em qualquer cliente
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS ecoacao;                                  -- [AJUSTE] recria do zero
CREATE DATABASE ecoacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecoacao;

-- -----------------------------------------------------
-- Usuario: o campo Tipo define as permissões no site
--   padrao = usuário comum | ong = organização | admin = administrador
-- -----------------------------------------------------
CREATE TABLE Usuario(
	Id_Usuario INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Login VARCHAR(30) NULL UNIQUE,           -- [AJUSTE] apelido opcional (o site entra por e-mail)
    CPF VARCHAR(11) NULL UNIQUE,             -- [AJUSTE] era INT(11): não cabe 11 dígitos
    Nome VARCHAR(100) NOT NULL,              -- [AJUSTE] era VARCHAR(50)
    Email VARCHAR(150) NOT NULL UNIQUE,      -- [AJUSTE] novo: usado no login do site
    Endereco VARCHAR(100),
    Senha VARCHAR(255) NOT NULL,             -- [AJUSTE] guarda o HASH bcrypt (60 caracteres), nunca a senha pura
    Telefone VARCHAR(15),                    -- [AJUSTE] era INT(16): estourava com DDD
    Tipo ENUM('padrao', 'ong', 'admin') NOT NULL DEFAULT 'padrao',   -- [AJUSTE] novo
    Criado_Em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP           -- [AJUSTE] novo
);
CREATE TABLE Funcionario(
	ID INT(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Nome VARCHAR(50),
    Senha INT(20),
    Cargo VARCHAR(30)
);
CREATE TABLE Jogo(
	ID_Jogo INT(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Nome_Jogo VARCHAR(40),
    Descricao VARCHAR(200),
    Nivel INT(3)
);
CREATE TABLE Pontuação(
	ID_Usuario INT(6) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Pontos INT(20),
    Quantidade_erros INT(10),
    Quantidade_Acertos INT(10),
    Data DATE,
    FK_Jogo_ID_Jogo INT(20) NOT NULL,
    FK_Usuario_ID_Usuario INT(20),
    FOREIGN KEY (FK_Jogo_ID_Jogo)
    REFERENCES Jogo (ID_Jogo),
	FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE      -- [AJUSTE] cascade
);
CREATE TABLE Coleta(
	ID_Coleta INT(20) NOT NULL PRIMARY KEY,
    Dia DATE,
    Tipo_Residuo VARCHAR(30),
    Região VARCHAR(50),
    Hora INT(4)
);

-- -----------------------------------------------------
-- Rotas: rotas de coleta de lixo (a coleta se repete toda semana)
-- -----------------------------------------------------
CREATE TABLE Rotas(
	ID_Rota INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Bairro VARCHAR(100) NOT NULL,                                   -- [AJUSTE] novo
    Tipo_Residuo ENUM('organico', 'reciclavel', 'seletiva') NOT NULL,  -- [AJUSTE] era VARCHAR(200) livre
    Dia_Semana ENUM('Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira',
                    'Sexta-feira', 'Sábado', 'Domingo') NOT NULL,   -- [AJUSTE] novo (substitui a coluna Data)
    Horario_Coleta TIME NOT NULL,
    Ponto_Referencia VARCHAR(200) NOT NULL,                         -- [AJUSTE] era "Endereço"
    Distancia DECIMAL(10, 2) NULL                                   -- km da rota (opcional; o site não usa)
);
CREATE TABLE Projetos(
	ID_Projeto INT(10) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Foto VARCHAR(200),
    Nome VARCHAR(60),
    Vídeo VARCHAR(200),
    Descrição VARCHAR(300),
    Materiais VARCHAR(200),
    Datas DATE
);
CREATE TABLE Projetos_Comunidade(
	ID_Projeto_Comunidade INT(10) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Nome VARCHAR(200),
    Foto VARCHAR(200),
    Data_Envio DATE,
    Video VARCHAR(200),
    FK_Usuario_ID_Usuario INT(10),
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE      -- [AJUSTE] cascade
);

-- -----------------------------------------------------
-- ONGS: perfil da organização, ligado ao usuário (login) da ONG
-- -----------------------------------------------------
CREATE TABLE ONGS(
	ID_ONG INT PRIMARY KEY NOT NULL AUTO_INCREMENT,         -- [AJUSTE] ganhou AUTO_INCREMENT
    Nome VARCHAR(200),
    CNPJ VARCHAR(14),                                       -- [AJUSTE] era INT(18): não cabe 14 dígitos
    Endereço VARCHAR(300),
    Telefone VARCHAR(15),                                   -- [AJUSTE] era INT(20)
  	Descrição VARCHAR(300),
    FK_Usuario_ID_Usuario INT NULL UNIQUE,                  -- [AJUSTE] novo: login da ONG
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE SET NULL
);
CREATE TABLE Ponto_de_Coleta(
	ID_Ponto INT(10) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Nome VARCHAR(200),
    Endereço VARCHAR(200),
    Telefone VARCHAR(15),                                   -- [AJUSTE] era INT(20)
    Horario_Funcionamento VARCHAR(20),
    Tipo_Residuo VARCHAR(200)
);

-- -----------------------------------------------------
-- Voluntario: vagas de voluntariado, cada uma de uma ONG
-- -----------------------------------------------------
CREATE TABLE Voluntario(
	ID_Voluntario INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Nome VARCHAR(120) NOT NULL,                             -- título da vaga
    Vagas INT NOT NULL,                                     -- quantidade de vagas
    Locais VARCHAR(200) NOT NULL,                           -- local da ação
    Horario TIME NULL,                                      -- horário (opcional)
    `Data` DATE NOT NULL,
    Descricao VARCHAR(1000) NOT NULL,                       -- [AJUSTE] era VARCHAR(200), sem acento
    FK_Usuario_ID_Usuario INT NOT NULL,                     -- [AJUSTE] novo: a ONG (usuário tipo "ong") dona da vaga
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Inscricao: liga um usuário a uma vaga (sem repetir)   [AJUSTE] tabela nova
-- -----------------------------------------------------
CREATE TABLE Inscricao(
	ID_Inscricao INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    FK_Usuario_ID_Usuario INT NOT NULL,
    FK_Voluntario_ID_Voluntario INT NOT NULL,
    Data_Inscricao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (FK_Usuario_ID_Usuario, FK_Voluntario_ID_Voluntario),
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (FK_Voluntario_ID_Voluntario)
    REFERENCES Voluntario (ID_Voluntario) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Postagem: publicações da comunidade
-- -----------------------------------------------------
CREATE TABLE Postagem(
	ID_Postagem INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Video VARCHAR(200),
    Descricao VARCHAR(1000),                                -- [AJUSTE] texto da publicação (era Descrição VARCHAR(300))
    Foto VARCHAR(255),
    `Data` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,     -- [AJUSTE] era DATE: agora guarda a hora também
    Titulo VARCHAR(100),                                    -- [AJUSTE] sem acento; opcional
    FK_Usuario_ID_Usuario INT NOT NULL,
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE
);
CREATE TABLE Comentarios(
	ID_Comentario INT PRIMARY KEY AUTO_INCREMENT,
    Texto VARCHAR(200),
    Data DATE,
    Hora TIME,
    FK_Usuario_ID_Usuario INT(20),
    FK_Postagem_ID_Postagem INT(20),
    FOREIGN KEY (FK_Usuario_ID_Usuario)
    REFERENCES Usuario (Id_Usuario) ON DELETE CASCADE,     -- [AJUSTE] cascade
    FOREIGN KEY (FK_Postagem_ID_Postagem)
    REFERENCES Postagem (ID_Postagem) ON DELETE CASCADE    -- [AJUSTE] cascade
);

-- DADOS FICTÍCIOS PARA DEMONSTRAÇÃO.
-- Senhas (guardadas com bcrypt): senha_teste1..4 | admin123 | ong123
INSERT INTO Usuario(Login, CPF, Nome, Email, Endereco, Senha, Telefone, Tipo)
VALUES
    ('ana.souza', '1001', 'Ana Souza', 'ana.souza@ecoacao.com', 'Rua das Flores', '$2y$10$WXqhIIWUWftqgO2KSH9fa.TvYLFaJ.xKU6dFWwQy4DpBT5gX4twFW', '1111', 'padrao'),
    ('bruno.lima', '1002', 'Bruno Lima', 'bruno.lima@ecoacao.com', 'Rua do Sol', '$2y$10$bUkXdqNPp7JEqwzZoP5J8.DA6WrnyreQlcpbG0AKdrlUJUOUXWswK', '2222', 'padrao'),
    ('carla.nunes', '1003', 'Carla Nunes', 'carla.nunes@ecoacao.com', 'Rua Verde', '$2y$10$AvReHGoMD/2ohWwUAMN54eOkRomem1JhySHXH7515npvGvdXRa3F6', '3333', 'padrao'),
    ('diego.alves', '1004', 'Diego Alves', 'diego.alves@ecoacao.com', 'Rua Azul', '$2y$10$z/E/9o75lGTtchxVxflwDO/frNoDf43oWJFyZL9ybgmnxHllCCDke', '4444', 'padrao'),
    ('admin', NULL, 'Administrador EcoAção', 'admin@ecoacao.com', NULL, '$2y$10$pY1bcP6JToMoGvEFSxKcnu3RXXryFTKFhxmQ.Symee6u1fZc0jHnm', NULL, 'admin'),
    ('marlimpo', NULL, 'Instituto Mar Limpo', 'marlimpo@ecoacao.com', NULL, '$2y$10$SBgVdMCLVLVIcG0tmemV3OPhT2P7tMOn/DRKGMFuVyGbKQ51Zk25u', NULL, 'ong'),
    ('verdevida', NULL, 'Verde Vida ONG', 'verdevida@ecoacao.com', NULL, '$2y$10$SBgVdMCLVLVIcG0tmemV3OPhT2P7tMOn/DRKGMFuVyGbKQ51Zk25u', NULL, 'ong');

-- Perfis das duas ONGs (ligados aos usuários 6 e 7). CNPJ fictício.
INSERT INTO ONGS (Nome, CNPJ, Endereço, Telefone, Descrição, FK_Usuario_ID_Usuario)
VALUES
    ('Instituto Mar Limpo', '12345678000195', 'Matinhos - PR', '4130000001', 'Limpeza de praias e educação ambiental.', 6),
    ('Verde Vida ONG', '98765432000110', 'Curitiba - PR', '4130000002', 'Plantio de árvores, hortas e oficinas de reciclagem.', 7);

INSERT INTO Jogo (Nome_Jogo, Descricao, Nivel)
VALUES
    ('Reciclagem', 'Aprendendo a separar residuos', 2),
    ('Energia Limpa', 'Fontes de energia sustentavel', 5),
    ('Consumo de Agua', 'Uso consciente da agua', 8);

INSERT INTO `Pontuação`(Pontos, Quantidade_erros, Quantidade_Acertos, `Data`, FK_Jogo_ID_Jogo, FK_Usuario_ID_Usuario)
VALUES
    (60, 2, 10, '2026-10-30', 1, 1),
    (45, 1, 5, '2026-10-31', 2, 2),
    (5, 3, 2, '2026-11-01', 1, 3);

-- 6 vagas de voluntariado (as ONGs são os usuários 6 e 7)
INSERT INTO Voluntario (Nome, Vagas, Locais, Horario, `Data`, Descricao, FK_Usuario_ID_Usuario)
VALUES
    ('Mutirão de limpeza de praia', 40, 'Praia de Caiobá, Matinhos - PR', '07:30', '2026-11-21',
     'Ajude a retirar lixo da areia e da faixa de restinga. Luvas, sacos e lanche serão fornecidos pela organização. Use roupa leve, protetor solar e traga sua garrafa de água.', 6),
    ('Plantio de árvores nativas', 30, 'Parque Barigui, Curitiba - PR', '08:00', '2026-11-28',
     'Vamos plantar mudas de espécies nativas para recuperar uma área verde do parque. Não é preciso experiência: uma equipe de biólogos orienta todas as etapas.', 7),
    ('Oficina de reciclagem criativa', 20, 'Centro Comunitário do Cajuru, Curitiba - PR', '14:00', '2026-12-05',
     'Oficina para ensinar a transformar garrafas PET, caixas e papelão em objetos úteis. Buscamos voluntários para apoiar os participantes e organizar os materiais.', 7),
    ('Campanha de coleta de óleo de cozinha', 15, 'Praça do Japão, Água Verde, Curitiba - PR', '09:00', '2026-12-12',
     'Receba o óleo usado pelos moradores, ajude a armazenar corretamente e explique por que ele não deve ser descartado na pia. O material segue para reciclagem.', 6),
    ('Horta comunitária', 25, 'Horta Comunitária do Xaxim, Curitiba - PR', '08:30', '2026-12-19',
     'Mutirão de manutenção da horta do bairro: preparo dos canteiros, rega, compostagem e colheita. As hortaliças são divididas entre as famílias participantes.', 7),
    ('Educação ambiental em escolas', 10, 'Escolas municipais do bairro Boa Vista, Curitiba - PR', '14:30', '2026-11-25',
     'Voluntários conduzem atividades lúdicas sobre separação de resíduos e consumo consciente com crianças do ensino fundamental. Treinamento rápido incluso.', 6);

-- Algumas inscrições de exemplo
INSERT INTO Inscricao (FK_Usuario_ID_Usuario, FK_Voluntario_ID_Voluntario) VALUES
    (1, 1), (2, 1), (3, 2), (1, 2), (2, 5);

-- 8 rotas de coleta
INSERT INTO Rotas (Bairro, Tipo_Residuo, Dia_Semana, Horario_Coleta, Ponto_Referencia)
VALUES
    ('Centro',           'organico',   'Segunda-feira', '19:00', 'Praça Tiradentes'),
    ('Centro',           'reciclavel', 'Quarta-feira',  '08:30', 'Calçadão da Rua XV de Novembro'),
    ('Batel',            'seletiva',   'Terça-feira',   '09:00', 'Praça Espanha'),
    ('Água Verde',       'reciclavel', 'Quinta-feira',  '14:00', 'Praça do Japão'),
    ('Portão',           'organico',   'Sexta-feira',   '06:30', 'Terminal do Portão'),
    ('Santa Felicidade', 'seletiva',   'Sábado',        '10:00', 'Praça Garibaldi'),
    ('Cajuru',           'organico',   'Quarta-feira',  '07:00', 'Em frente ao Centro Comunitário'),
    ('Boa Vista',        'reciclavel', 'Domingo',       '08:00', 'Próximo ao Terminal Boa Vista');

INSERT INTO Postagem (Video, Descricao, Foto, `Data`, Titulo, FK_Usuario_ID_Usuario)
VALUES
    (NULL, 'Ação de limpeza comunitária', NULL, '2026-10-20 09:00:00', 'MUTIRÃO ECOAÇÃO', 1),
    (NULL, 'Dicas para reciclar', NULL, '2026-10-21 10:30:00', 'DICA DE RECICLAGEM', 1),
    (NULL, 'Plantio de mudas', NULL, '2026-10-25 15:10:00', 'HORTA COMUNITÁRIA', 1),
    (NULL, 'Separação correta dos materiais', NULL, '2026-11-01 11:45:00', 'COLETA SELETIVA', 1),
    (NULL, 'Economia de energia em casa', NULL, '2026-10-28 18:20:00', 'ENERGIA LIMPA', 2),
    (NULL, 'A Verde Vida abriu inscrições para o plantio de árvores nativas no Parque Barigui. Confira a página de voluntariado e participe!', NULL, '2026-11-03 18:30:00', 'Plantio de árvores', 7),
    (NULL, 'Neste mês teremos mutirão de limpeza de praia. As vagas são limitadas, garanta a sua na página de voluntariado.', NULL, '2026-11-04 08:00:00', 'Mutirão de limpeza de praia', 6);

INSERT INTO Comentarios (Texto, `Data`, Hora, FK_Usuario_ID_Usuario, FK_Postagem_ID_Postagem)
VALUES
    ('Muito boa a iniciativa!', '2026-10-20', '10:00:00', 2, 1),
    ('Parabens pela acao.', '2026-10-20', '10:30:00', 3, 1),
    ('Vou participar tambem.', '2026-10-28', '14:00:00', 1, 5);

-- FUNCTIONS

DROP FUNCTION IF EXISTS fn_classificar_nivel;
DELIMITER $$
CREATE FUNCTION fn_classificar_nivel(p_nivel INT)
RETURNS VARCHAR(20)
DETERMINISTIC -- Para definir que seja sempre mostrado Iniciante, intermediario etc.
NO SQL
BEGIN
    RETURN CASE
        WHEN p_nivel IS NULL OR p_nivel < 1 THEN 'Não definido'
        WHEN p_nivel <= 3 THEN 'Iniciante'
        WHEN p_nivel <= 6 THEN 'Intermediário'
        ELSE 'Avançado'
    END;
END$$
DELIMITER ;

-- Finalidade: retorna a soma de pontos de um usuário.
-- Parâmetro: p_id_usuario - como identificador do usuário.
-- Exemplo: SELECT fn_total_pontos_usuario(1);
DROP FUNCTION IF EXISTS fn_total_pontos_usuario;
DELIMITER $$
CREATE FUNCTION fn_total_pontos_usuario(p_id_usuario INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;

    SELECT COALESCE(SUM(Pontos), 0)
      INTO v_total
      FROM `Pontuação`
     WHERE FK_Usuario_ID_Usuario = p_id_usuario;

    RETURN COALESCE(v_total, 0);
END$$
DELIMITER ;

-- Finalidade: padroniza o nome para exibição em relatórios.
-- Parâmetro: p_nome - nome recebido.
-- Exemplo: SELECT fn_formatar_nome('ana silva');
DROP FUNCTION IF EXISTS fn_formatar_nome;
DELIMITER $$
CREATE FUNCTION fn_formatar_nome(p_nome VARCHAR(100))
RETURNS VARCHAR(100)
DETERMINISTIC
NO SQL
BEGIN
    RETURN UPPER(TRIM(COALESCE(p_nome, 'NÃO INFORMADO')));
END$$
DELIMITER ;


-- VIEWS


-- Finalidade: ranking de desempenho por usuário e jogo, com
-- classificação do nível e total de partidas registradas.
-- Colunas: usuário, jogo, nível, classificação, partidas,
-- pontos acumulados, média de pontos e data mais recente.
DROP VIEW IF EXISTS vw_ranking_jogos;
CREATE OR REPLACE VIEW vw_ranking_jogos
(
    Usuario,
    Jogo,
    Nivel,
    Faixa_Nivel,
    Partidas,
    Total_Pontos,
    Media_Pontos,
    Ultima_Partida
) AS
SELECT
    fn_formatar_nome(u.Nome) AS Usuario,
    UPPER(j.Nome_Jogo) AS Jogo,
    j.Nivel AS Nivel,
    fn_classificar_nivel(j.Nivel) AS Faixa_Nivel,
    COUNT(p.ID_Usuario) AS Partidas,
    COALESCE(SUM(p.Pontos), 0) AS Total_Pontos,
    COALESCE(AVG(p.Pontos), 0) AS Media_Pontos,
    MAX(p.`Data`) AS Ultima_Partida
FROM Usuario AS u
INNER JOIN `Pontuação` AS p
    ON p.FK_Usuario_ID_Usuario = u.Id_Usuario
INNER JOIN Jogo AS j
    ON j.ID_Jogo = p.FK_Jogo_ID_Jogo
WHERE p.`Data` BETWEEN '2000-01-01' AND '2099-12-31'
  AND j.Nivel IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
  AND j.Nome_Jogo LIKE '%'
  AND p.FK_Usuario_ID_Usuario IS NOT NULL
  AND p.Pontos IS NOT NULL
GROUP BY u.Id_Usuario, u.Nome, j.ID_Jogo, j.Nome_Jogo, j.Nivel
HAVING COUNT(p.ID_Usuario) >= 1
ORDER BY Total_Pontos DESC, Usuario ASC;

-- Finalidade: mostrar todos os usuários, inclusive os que ainda
-- não publicaram nada, contabilizando zero no lugar de NULL.
DROP VIEW IF EXISTS vw_atividade_usuarios;
CREATE OR REPLACE VIEW vw_atividade_usuarios AS
SELECT
    u.Id_Usuario AS ID_Usuario,
    fn_formatar_nome(u.Nome) AS Nome_Usuario,
    COALESCE(COUNT(po.ID_Postagem), 0) AS Total_Postagens,
    COALESCE(DATE_FORMAT(MAX(po.`Data`), '%d/%m/%Y'), 'Sem postagem') AS Ultima_Postagem,
    CASE
        WHEN COUNT(po.ID_Postagem) = 0 THEN 'Sem atividade'
        WHEN COUNT(po.ID_Postagem) BETWEEN 1 AND 3 THEN 'Pouco ativo'
        ELSE 'Ativo'
    END AS Situacao,
    COALESCE(DATEDIFF(CURDATE(), MAX(po.`Data`)), 0) AS Dias_Desde_Postagem
FROM Usuario AS u
LEFT JOIN Postagem AS po
    ON po.FK_Usuario_ID_Usuario = u.Id_Usuario
GROUP BY u.Id_Usuario, u.Nome
ORDER BY Total_Postagens DESC, Nome_Usuario ASC;

-- Finalidade: exibir informações públicas das postagens e quantidade
-- de comentários, sem expor CPF, senha, telefone ou endereço do usuário.
DROP VIEW IF EXISTS vw_postagens_publicas;
CREATE OR REPLACE VIEW vw_postagens_publicas AS
SELECT
    po.ID_Postagem AS ID_Postagem,
    po.Titulo AS Titulo,
    po.Descricao AS Descricao,
    po.Foto AS Foto,
    po.Video AS Video,
    po.`Data` AS Data_Publicacao,
    fn_formatar_nome(u.Nome) AS Autor,
    COUNT(c.ID_Comentario) AS Quantidade_Comentarios
FROM Postagem AS po
INNER JOIN Usuario AS u
    ON u.Id_Usuario = po.FK_Usuario_ID_Usuario
LEFT JOIN Comentarios AS c
    ON c.FK_Postagem_ID_Postagem = po.ID_Postagem
WHERE po.FK_Usuario_ID_Usuario IS NOT NULL
GROUP BY po.ID_Postagem, po.Titulo, po.Descricao, po.Foto,
         po.Video, po.`Data`, u.Nome
ORDER BY po.`Data` DESC, po.ID_Postagem DESC;


-- PROCEDURES

-- Finalidade: cadastrar uma postagem e seu primeiro comentário.
-- Parâmetros: dados da postagem, usuário, texto do comentário e OUT
-- com o ID da postagem criada.
-- Exemplo: CALL sp_criar_postagem_com_comentario(..., @id);
DROP PROCEDURE IF EXISTS sp_criar_postagem_com_comentario;
DELIMITER $$
CREATE PROCEDURE sp_criar_postagem_com_comentario(
    IN p_id_usuario INT,
    IN p_titulo VARCHAR(100),
    IN p_descricao VARCHAR(1000),
    IN p_foto VARCHAR(255),
    IN p_video VARCHAR(200),
    IN p_texto_comentario VARCHAR(200),
    OUT p_id_postagem_criada INT
)
BEGIN
    DECLARE v_id_postagem INT;
    DECLARE v_id_comentario INT;
    DECLARE v_usuario_existe INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET p_id_postagem_criada = NULL;

    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um ID de usuario valido.';
    ELSEIF p_titulo IS NULL OR TRIM(p_titulo) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O titulo da postagem e obrigatorio.';
    ELSEIF p_texto_comentario IS NULL OR TRIM(p_texto_comentario) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'O comentario inicial e obrigatorio.';
    END IF;

    SELECT COUNT(*)
      INTO v_usuario_existe
      FROM Usuario
     WHERE Id_Usuario = p_id_usuario;

    IF v_usuario_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Usuario nao encontrado.';
    END IF;

    START TRANSACTION;

    SELECT COALESCE(MAX(ID_Postagem), 0) + 1
      INTO v_id_postagem
      FROM Postagem;

    -- [AJUSTE] colunas sem acento e NOW() no lugar de CURDATE() (a coluna Data agora guarda a hora)
    INSERT INTO Postagem
        (ID_Postagem, Video, Descricao, Foto, `Data`, Titulo,
         FK_Usuario_ID_Usuario)
    VALUES
        (v_id_postagem, p_video, p_descricao, p_foto, NOW(),
         p_titulo, p_id_usuario);

    -- Define o valor de LAST_INSERT_ID para recuperar a postagem criada.
    SET v_id_postagem = LAST_INSERT_ID(v_id_postagem);

    SELECT COALESCE(MAX(ID_Comentario), 0) + 1
      INTO v_id_comentario
      FROM Comentarios;

    INSERT INTO Comentarios
        (ID_Comentario, Texto, `Data`, Hora,
         FK_Usuario_ID_Usuario, FK_Postagem_ID_Postagem)
    VALUES
        (v_id_comentario, p_texto_comentario, CURDATE(), CURTIME(),
         p_id_usuario, LAST_INSERT_ID());

    SET p_id_postagem_criada = v_id_postagem;

    COMMIT;
END$$
DELIMITER ;

-- Finalidade: recalcular os pontos de um registro de jogo.
-- Regra que eu coloquei: 10 pontos por acerto e desconto de 5 por erro,
-- sem permitir resultado negativo. Devolve o total do usuário via OUT.
-- Exemplo: CALL sp_atualizar_pontuacao(1, @total); SELECT @total;
DROP PROCEDURE IF EXISTS sp_atualizar_pontuacao;
DELIMITER $$
CREATE PROCEDURE sp_atualizar_pontuacao(
    IN p_id_registro_pontuacao INT,
    OUT p_total_usuario INT
)
BEGIN
    DECLARE v_id_usuario INT;
    DECLARE v_acertos INT DEFAULT 0;
    DECLARE v_erros INT DEFAULT 0;
    DECLARE v_existe INT DEFAULT 0;

    IF p_id_registro_pontuacao IS NULL OR p_id_registro_pontuacao <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um ID de pontuacao valido.';
    END IF;

    SELECT COUNT(*)
      INTO v_existe
      FROM `Pontuação`
     WHERE ID_Usuario = p_id_registro_pontuacao;

    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Registro de pontuacao nao encontrado.';
    END IF;

    SELECT FK_Usuario_ID_Usuario,
           COALESCE(Quantidade_Acertos, 0),
           COALESCE(Quantidade_erros, 0)
      INTO v_id_usuario, v_acertos, v_erros
      FROM `Pontuação`
     WHERE ID_Usuario = p_id_registro_pontuacao;

    UPDATE `Pontuação`
       SET Pontos = CASE
           WHEN (COALESCE(Quantidade_Acertos, 0) * 10) -
                (COALESCE(Quantidade_erros, 0) * 5) < 0 THEN 0
           ELSE (COALESCE(Quantidade_Acertos, 0) * 10) -
                (COALESCE(Quantidade_erros, 0) * 5)
       END
     WHERE ID_Usuario = p_id_registro_pontuacao;

    SET p_total_usuario = fn_total_pontos_usuario(v_id_usuario);
END$$
DELIMITER ;

-- Finalidade: gerar relatório de pontuação de um usuário em um período.
-- Parâmetros: ID do usuário e datas inicial/final.
-- Exemplo: CALL sp_relatorio_pontuacao(1, '2026-01-01', '2026-12-31');
DROP PROCEDURE IF EXISTS sp_relatorio_pontuacao;
DELIMITER $$
CREATE PROCEDURE sp_relatorio_pontuacao(
    IN p_id_usuario INT,
    IN p_data_inicio DATE,
    IN p_data_fim DATE
)
BEGIN
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe um ID de usuario valido.';
    ELSEIF p_data_inicio IS NULL OR p_data_fim IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Informe a data inicial e a data final.';
    ELSEIF p_data_inicio > p_data_fim THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A data inicial nao pode ser maior que a final.';
    END IF;

    SELECT
        u.Id_Usuario AS ID_Usuario,
        fn_formatar_nome(u.Nome) AS Nome_Usuario,
        j.Nome_Jogo AS Jogo,
        j.Nivel AS Nivel,
        fn_classificar_nivel(j.Nivel) AS Classificacao,
        p.Pontos AS Pontos,
        p.Quantidade_Acertos AS Acertos,
        p.Quantidade_erros AS Erros,
        p.`Data` AS Data_Partida,
        fn_total_pontos_usuario(u.Id_Usuario) AS Total_Pontos_Usuario
    FROM Usuario AS u
    INNER JOIN `Pontuação` AS p
        ON p.FK_Usuario_ID_Usuario = u.Id_Usuario
    INNER JOIN Jogo AS j
        ON j.ID_Jogo = p.FK_Jogo_ID_Jogo
    WHERE u.Id_Usuario = p_id_usuario
      AND p.`Data` >= p_data_inicio
      AND p.`Data` < DATE_ADD(p_data_fim, INTERVAL 1 DAY)
    ORDER BY p.`Data` DESC, p.Pontos DESC;
END$$
DELIMITER ;


-- VIEW DE SEGURANÇA: usuário com SELECT somente na view pública.
-- Execute esta parte com uma conta que tenha privilégio CREATE USER
-- e GRANT. Troque a senha de exemplo antes de usar.


CREATE USER IF NOT EXISTS 'ecoacao_leitor'@'localhost'
IDENTIFIED BY 'Troque_Esta_Senha_123!';
GRANT SELECT ON `ecoacao`.`vw_postagens_publicas`
TO 'ecoacao_leitor'@'localhost';


-- CONSULTAS DE TESTE / EVIDÊNCIAS
-- Execute depois de inserir dados compatíveis nas tabelas.

-- Views: consultas com WHERE e ORDER BY.
SELECT Usuario, Jogo, Nivel, Faixa_Nivel, Partidas, Total_Pontos,
       Media_Pontos, Ultima_Partida
FROM vw_ranking_jogos
WHERE Total_Pontos BETWEEN 0 AND 10000
ORDER BY Total_Pontos DESC, Usuario ASC;

SELECT ID_Usuario, Nome_Usuario, Total_Postagens, Situacao,
       Dias_Desde_Postagem
FROM vw_atividade_usuarios
WHERE Situacao IN ('Sem atividade', 'Ativo')
ORDER BY Total_Postagens DESC, Nome_Usuario ASC;

SELECT ID_Postagem, Titulo, Autor, Quantidade_Comentarios, Data_Publicacao
FROM vw_postagens_publicas
WHERE Titulo LIKE '%'
ORDER BY Data_Publicacao DESC, ID_Postagem DESC;

-- Functions chamadas dentro de SELECT.
SELECT ID_Jogo, Nome_Jogo, Nivel,
       fn_classificar_nivel(Nivel) AS Classificacao
FROM Jogo
ORDER BY Nivel, Nome_Jogo;

SELECT Id_Usuario, Nome,
       fn_total_pontos_usuario(Id_Usuario) AS Total_Pontos
FROM Usuario
ORDER BY Total_Pontos DESC, Nome;

SELECT Id_Usuario, Nome,
       fn_formatar_nome(Nome) AS Nome_Formatado
FROM Usuario
ORDER BY Nome;
