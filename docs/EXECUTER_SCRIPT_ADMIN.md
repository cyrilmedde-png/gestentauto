# Exécuter le script pour créer votre compte admin

## ✅ Votre UUID est : `178e64c6-6058-4503-937e-85b4d70d8152`

## Étapes rapides :

1. **Ouvrez Supabase Dashboard > SQL Editor**

2. **Ouvrez le fichier** `database/create_admin_user_ready.sql`

3. **Copiez tout le contenu** du fichier

4. **Collez dans l'éditeur SQL** de Supabase

5. **Exécutez le script** (bouton "Run" ou F5)

6. **Vérifiez les résultats** :
   - Vous devriez voir les messages de succès avec les IDs
   - Une table de vérification s'affichera en bas

## Après exécution :

Vous pouvez maintenant vous connecter sur `http://localhost:3000/auth/login` avec :
- **Email** : `groupemclem@gmail.com`
- **Mot de passe** : celui que vous avez défini dans Supabase

Votre compte aura :
- ✅ Tous les droits administrateur
- ✅ Accès à toutes les fonctionnalités
- ✅ Gestion complète de l'entreprise "Groupe Mclem"

## En cas d'erreur :

Si vous voyez une erreur "duplicate key" pour l'entreprise :
- C'est normal si l'entreprise existe déjà
- Le script gère cela avec `ON CONFLICT DO UPDATE`
- L'utilisateur et le rôle seront quand même créés/mis à jour




