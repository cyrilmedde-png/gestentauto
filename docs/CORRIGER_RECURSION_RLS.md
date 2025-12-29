# Correction de la récursion infinie RLS

## Problème

L'erreur "infinite recursion detected in policy for relation 'users'" se produit parce que les politiques RLS de la table `users` utilisent une sous-requête sur la table `users` elle-même, créant une boucle infinie.

## Solution

Nous utilisons une fonction SQL avec `SECURITY DEFINER` qui contourne RLS pour obtenir le `company_id` de l'utilisateur actuel.

## Étapes pour corriger

### Option 1 : Script de correction (RECOMMANDÉ)

1. Ouvrez Supabase Dashboard > SQL Editor
2. Exécutez le script `database/fix_rls_recursion.sql`
3. Ce script va :
   - Créer la fonction helper `public.user_company_id()`
   - Supprimer les anciennes politiques problématiques
   - Recréer toutes les politiques sans récursion

### Option 2 : Réinstallation complète

Si vous préférez repartir de zéro :

1. Supprimez toutes les tables existantes (ou utilisez un nouveau projet Supabase)
2. Exécutez le script `database/schema_FIXED.sql` qui contient déjà les corrections

## Vérification

Après avoir exécuté le script, vous devriez pouvoir :
- Vous connecter sans erreur de récursion
- Voir vos données utilisateur dans la console
- Accéder au dashboard

## Note technique

La fonction `public.user_company_id()` utilise `SECURITY DEFINER`, ce qui signifie qu'elle s'exécute avec les privilèges du propriétaire de la fonction, contournant ainsi RLS. Cela permet d'obtenir le `company_id` sans créer de récursion.








