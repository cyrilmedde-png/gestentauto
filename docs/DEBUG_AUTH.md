# Debug Authentification

## Problème : Impossible de se connecter

### 1. Vérifier la configuration Supabase Auth

Dans le dashboard Supabase :
1. Aller dans **Authentication > Providers**
2. Vérifier que **Email** est activé
3. Vérifier les paramètres :
   - **Enable email confirmations** : Peut être désactivé pour le développement
   - **Enable email signups** : Doit être activé
   - **Confirm email** : Peut être désactivé pour le développement

### 2. Problèmes courants

#### Email confirmation requise
Si l'email confirmation est activée dans Supabase :
- L'utilisateur doit cliquer sur le lien de confirmation reçu par email
- Sinon, la connexion échouera même avec le bon mot de passe

**Solution temporaire (développement)** :
- Désactiver "Enable email confirmations" dans Supabase
- Ou utiliser la fonctionnalité de confirmation manuelle

#### Compte non créé correctement
Vérifier dans Supabase :
- **Authentication > Users** : L'utilisateur existe-t-il ?
- **Table Editor > users** : Y a-t-il une entrée pour cet utilisateur ?
- **Table Editor > companies** : Y a-t-il une entreprise associée ?

#### Problème de RLS (Row Level Security)
Si RLS bloque l'accès :
- Vérifier que les politiques RLS sont correctement configurées
- Tester avec le Service Role Key pour contourner temporairement

### 3. Vérifications à faire

1. **Dans la console du navigateur** :
   - Ouvrir les DevTools (F12)
   - Onglet Console
   - Tenter une connexion
   - Vérifier les erreurs affichées

2. **Dans Supabase Logs** :
   - Dashboard Supabase > Logs > API Logs
   - Vérifier les erreurs lors de la tentative de connexion

3. **Tester directement avec Supabase** :
   - Utiliser le Supabase SQL Editor pour vérifier les données
   - Vérifier que l'utilisateur existe dans `auth.users`
   - Vérifier que l'entrée existe dans `public.users`



