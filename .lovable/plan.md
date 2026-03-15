

## Diagnóstico

O `AppSidebar.tsx` já possui a lógica de logout com redirecionamento para `/` (página principal). O código está correto:

```typescript
const handleLogout = () => {
  logout();
  navigate("/");
};
```

**Possível causa do problema**: O BottomNav (menu mobile, visível em telas menores que `md`) não tem botão de sair. Se o usuário está em mobile, não consegue fazer logout.

## Plano

### 1. Adicionar botão "Sair" no BottomNav (mobile)
- Adicionar ícone `LogOut` ao `BottomNav.tsx`
- Importar `useNavigate` e `useAuth`
- Adicionar botão que executa `logout()` + `navigate("/")`
- Manter o design existente (mesmo estilo dos outros itens)

### 2. Verificar se o sidebar desktop está funcionando
- Confirmar que o `handleLogout` no `AppSidebar.tsx` está vinculado corretamente ao botão (já está — sem mudanças necessárias)

**Escopo**: Apenas adicionar logout ao BottomNav mobile. Nenhuma outra alteração.

