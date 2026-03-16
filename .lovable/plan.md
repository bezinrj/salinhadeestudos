

# Plano: Mostrar curtidas recebidas no próprio perfil

## Problema
Na linha 134, o `ProfileLikeButton` (que mostra o contador de curtidas) só aparece quando `!isOwnProfile`. O usuário não consegue ver quantas curtidas recebeu no próprio perfil.

## Solução

No `src/pages/Profile.tsx`, adicionar um badge/indicador de curtidas visível para o próprio usuário, usando o `likes_count` que já existe no perfil (atualizado automaticamente pelo trigger `update_likes_count`).

Na linha 128-135, após o badge de carreira e antes do `ProfileLikeButton`, adicionar para `isOwnProfile`:

```tsx
{isOwnProfile && profile.likes_count > 0 && (
  <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 text-xs">
    <Heart className="h-3 w-3 mr-1 fill-current" /> {profile.likes_count} curtida{profile.likes_count !== 1 ? 's' : ''}
  </Badge>
)}
```

O ícone `Heart` já está importado. Apenas 1 arquivo editado, sem mudanças no banco.

