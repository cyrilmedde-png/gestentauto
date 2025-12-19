# 📧 Désactiver la confirmation d'email (Développement)

## 🔍 Situation actuelle

L'inscription fonctionne, mais Supabase envoie un email de confirmation. En développement, c'est pratique de désactiver cette fonctionnalité.

## ✅ Solution : Désactiver la confirmation d'email

### Option 1 : Dans Supabase Dashboard (Recommandé pour le développement)

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Sélectionnez votre projet
3. Allez dans **Authentication** (🔐) > **Settings**
4. Dans la section **Email Auth**, trouvez **"Confirm email"**
5. **Désactivez** l'option "Enable email confirmations"
6. **Sauvegardez**

**Résultat** : Les nouveaux utilisateurs pourront se connecter immédiatement sans confirmer leur email.

### Option 2 : Modifier le code pour désactiver la confirmation

Si vous voulez désactiver uniquement en développement, modifiez `src/modules/core/lib/auth.ts` :

```typescript
export async function signUp(email: string, password: string, companyName: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      // Désactiver la confirmation en développement
      ...(process.env.NODE_ENV === 'development' && {
        data: { email_confirm: true }
      })
    }
  })
  // ...
}
```

## 📧 Page de confirmation créée

J'ai créé une page de confirmation à `/auth/confirm` qui :
- ✅ Vérifie le token de confirmation
- ✅ Affiche un message de succès/erreur
- ✅ Redirige automatiquement vers le dashboard

## 🔗 Configuration de l'URL de redirection

Dans Supabase Dashboard > Authentication > URL Configuration :

1. **Site URL** : `http://localhost:3000`
2. **Redirect URLs** : Ajoutez `http://localhost:3000/auth/confirm`

## 🚀 Test

### Si vous désactivez la confirmation :

1. Créez un nouveau compte
2. Vous serez directement connecté
3. Redirection vers le dashboard

### Si vous gardez la confirmation activée :

1. Créez un compte
2. Vérifiez votre email
3. Cliquez sur le lien de confirmation
4. Vous serez redirigé vers `/auth/confirm`
5. Puis vers le dashboard

## 💡 Recommandation

**Pour le développement** : Désactivez la confirmation d'email dans Supabase Dashboard pour aller plus vite.

**Pour la production** : Réactivez-la pour la sécurité.

## 📝 Note

La page `/auth/confirm` est déjà créée et fonctionnelle. Elle gère automatiquement la vérification du token et la redirection.

