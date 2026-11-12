
## Usuários de teste

| Tipo | E-mail | Senha |
|---|---|---|
| Administrador | admin@ecoacao.com | admin123 |
| ONG | marlimpo@ecoacao.com (Instituto Mar Limpo) | ong123 |
| ONG | verdevida@ecoacao.com (Verde Vida ONG) | ong123 |
| Usuário padrão | ana.souza@ecoacao.com | senha_teste1 |
| Usuário padrão | bruno.lima@ecoacao.com | senha_teste2 |
| Usuário padrão | carla.nunes@ecoacao.com | senha_teste3 |
| Usuário padrão | diego.alves@ecoacao.com | senha_teste4 |

## Permissões

| Ação | Visitante | Padrão | ONG | Admin |
|---|:-:|:-:|:-:|:-:|
| Ver vagas, rotas e postagens | sim | sim | sim | sim |
| Publicar na comunidade | não | sim | sim | sim |
| Excluir postagem | não | só a própria | só a própria | qualquer uma |
| Inscrever-se / cancelar inscrição | não | sim | sim | sim |
| Criar vaga | não | não | sim | sim |
| Editar / excluir vaga | não | não | só as próprias | todas |
| Ver inscritos de uma vaga | não | não | só das próprias | todas |
| Criar / editar / excluir rota de coleta | não | não | não | sim |
| Listar usuários, alterar tipo, excluir | não | não | não | sim |

As permissões são verificadas **no back-end** em cada rota (`api/*.php`, funções `exigirLogin`, `exigirTipo` e `vagaPermitida`).
Quem não tem permissão recebe o erro **403** (ou **401**, se não estiver logado) e o site mostra uma mensagem amigável.

## Como criar outro administrador

O tipo "admin" não aparece no cadastro. Gere o hash da senha e insira direto no banco:

```
php -r "echo password_hash('minha-senha', PASSWORD_DEFAULT);"
```

```sql
INSERT INTO Usuario (Nome, Email, Senha, Tipo)
VALUES ('Meu Nome', 'meu@email.com', 'COLE_O_HASH_AQUI', 'admin');
```

Ou, pelo painel de administração, mude o tipo de uma conta já existente.

