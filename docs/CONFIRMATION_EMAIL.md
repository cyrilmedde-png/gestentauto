# 📧 Confirmation d'email - Guide rapide

## ✅ Page de confirmation créée

J'ai créé la page `/auth/confirm` qui gère automatiquement la confirmation d'email.

## 🚀 Pour désactiver la confirmation (Développement)

### Méthode rapide : Dans Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Votre projet > **Authentication** > **Settings**
3. Section **Email Auth**
4. **Désactivez** "Enable email confirmations"
5. **Sauvegardez**

**Résultat** : Les nouveaux utilisateurs pourront se connecter immédiatement sans confirmer leur email.

## 📧 Si vous gardez la confirmation activée

1. L'utilisateur reçoit un email de confirmation
2. Il clique sur le lien
3. Il est redirigé vers `/auth/confirm`
4. La page vérifie le token
5. Redirection automatique vers le dashboard

## 🔗 Configuration Supabase

Dans **Authentication** > **URL Configuration** :

- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : `http://localhost:3000/auth/confirm`

## 💡 Recommandation

**Développement** : Désactivez la confirmation pour aller plus vite
**Production** : Réactivez-la pour la sécurité

