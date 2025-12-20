# Étapes pour pouvoir se connecter

## Problème actuel

Vous ne pouvez pas vous connecter car deux choses doivent être faites dans Supabase :

1. **Corriger les politiques RLS** (récursion infinie)
2. **Créer votre compte dans la table `users`**

## Étape 1 : Corriger les politiques RLS (OBLIGATOIRE)

1. Ouvrez Supabase Dashboard > SQL Editor
2. Exécutez le script : `database/fix_rls_recursion.sql`
   - Ce script corrige l'erreur de récursion infinie dans les politiques RLS
   - **SANS CETTE ÉTAPE, VOUS NE POURREZ PAS VOUS CONNECTER**

## Étape 2 : Créer votre compte dans la table `users` (OBLIGATOIRE)

Votre compte existe dans Supabase Auth (`auth.users`), mais pas dans la table `users` de votre base de données.

1. Ouvrez Supabase Dashboard > SQL Editor
2. Exécutez le script : `database/create_user_SIMPLE.sql`
   - Ce script crée votre entreprise et votre compte utilisateur
   - Utilise votre UUID : `178e64c6-6058-4503-937e-85b4d70d8152`

## Vérification

Après avoir exécuté les deux scripts :

1. Essayez de vous connecter avec :
   - Email : `groupemclem@gmail.com`
   - Mot de passe : votre mot de passe

2. Ouvrez la console du navigateur (F12) pour voir les logs :
   - ✅ "Connexion Supabase Auth réussie"
   - ✅ "Utilisateur trouvé dans la table users"
   - ❌ Si vous voyez une erreur, notez le message exact

## Si ça ne fonctionne toujours pas

1. Vérifiez dans Supabase Dashboard > Table Editor > `users` :
   - Votre email doit apparaître dans la table `users`
   - Avec votre UUID : `178e64c6-6058-4503-937e-85b4d70d8152`

2. Vérifiez dans Supabase Dashboard > Table Editor > `companies` :
   - Une entreprise "Groupe Mclem" doit exister

3. Vérifiez les logs de la console du navigateur et copiez l'erreur exacte


