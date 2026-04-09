

## Conceder acesso admin para vneto2023@gmail.com

O usuário `vneto2023@gmail.com` (ID: `ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6`) não possui nenhuma role no sistema atualmente.

### Ação
Inserir a role `admin` na tabela `user_roles` para esse usuário.

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('ffdb2f38-0e5b-4f29-8cb8-712fcfde53f6', 'admin');
```

Isso é uma operação de dados simples — sem alteração de schema.

Após a inserção, o usuário terá acesso completo ao painel administrativo e será protegido pelo trigger `protect_absolute_admin` que já existe no banco.

