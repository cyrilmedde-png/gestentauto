# 🔄 Correction boucle de redirection

## ❌ Problème identifié

La connexion tournait en rond à cause de :
1. L'utilisateur se connecte avec succès
2. Redirection vers `/dashboard`
3. `getCurrentUser()` retourne null si l'utilisateur n'est pas dans la table `users`
4. `ProtectedRoute` redirige vers `/auth/login`
5. Mais la session Supabase existe toujours
6. Boucle infinie

## ✅ Solutions appliquées

### 1. Page de login protégée

La page de login vérifie maintenant si l'utilisateur est déjà connecté et redirige vers le dashboard :

```typescript
useEffect(() => {
  if (!authLoading && user) {
    router.push('/dashboard')
  }
}, [user, authLoading, router])
```

### 2. Amélioration de getCurrentUser()

La fonction retourne maintenant les informations de base même si l'utilisateur n'est pas dans la table `users` :

```typescript
if (!userData) {
  return {
    id: user.id,
    email: user.email || '',
  }
}
```

Cela permet d'avoir une session valide même si le profil n'est pas encore complet dans notre table.

### 3. ProtectedRoute amélioré

Vérifie maintenant à la fois `session` et `user` :

```typescript
if (!loading && !session && !user) {
  router.push('/auth/login')
}
```

### 4. Meilleure gestion de la connexion

Après la connexion :
- Attente de 500ms pour que la session soit bien établie
- Rafraîchissement de l'état d'authentification
- Redirection vers le dashboard avec `router.refresh()`

## 🚀 Test

Maintenant, la connexion devrait fonctionner :

1. **Allez sur** `/auth/login`
2. **Entrez vos identifiants**
3. **Cliquez sur "Se connecter"**
4. **Vous serez redirigé vers** `/dashboard`
5. **Plus de boucle !**

## 🔍 Si le problème persiste

Vérifiez dans la console du navigateur (F12) :
- Y a-t-il des erreurs ?
- La session est-elle bien créée ?
- L'utilisateur existe-t-il dans la table `users` ?

Si l'utilisateur n'existe pas dans la table `users`, vous pouvez le créer manuellement ou vous réinscrire.

