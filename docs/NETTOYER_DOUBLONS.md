# Nettoyage des doublons d'entreprises

## Problème
Vous voyez plusieurs entrées identiques de la même entreprise dans la liste des clients alors que vous êtes le seul inscrit.

## Cause probable
- Inscriptions multiples
- Erreurs lors de l'inscription qui ont créé plusieurs entreprises
- Scripts SQL exécutés plusieurs fois

## Solution

### Étape 1 : Vérifier les doublons

Exécutez dans Supabase SQL Editor le script `database/verifier_companies.sql` pour voir :
1. Toutes les entreprises
2. Les entreprises avec leurs utilisateurs associés
3. Les entreprises en double
4. Le nombre d'utilisateurs par entreprise

### Étape 2 : Nettoyer les doublons

**⚠️ ATTENTION : Cette opération est irréversible**

1. Identifiez l'entreprise à conserver (généralement la plus ancienne)
2. Exécutez `database/nettoyer_doublons_companies.sql` dans Supabase SQL Editor
3. Le script :
   - Conserve l'entreprise la plus ancienne avec "Mclem" ou "Groupe" dans le nom
   - Supprime les utilisateurs associés aux entreprises en double
   - Supprime les entreprises en double

### Étape 3 : Vérifier le résultat

Après nettoyage, vous devriez voir :
- Une seule entreprise "Groupe Mclem"
- Un seul utilisateur associé à cette entreprise

## Alternative : Nettoyage manuel

Si vous préférez nettoyer manuellement :

```sql
-- 1. Voir toutes vos entreprises
SELECT * FROM companies WHERE name LIKE '%Mclem%' ORDER BY created_at;

-- 2. Identifier l'ID de l'entreprise à garder (la plus ancienne)
-- Supposons que c'est 'VOTRE_ID_A_GARDER'

-- 3. Supprimer les utilisateurs des autres entreprises
DELETE FROM users 
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE name LIKE '%Mclem%' 
  AND id != 'VOTRE_ID_A_GARDER'
);

-- 4. Supprimer les entreprises en double
DELETE FROM companies 
WHERE name LIKE '%Mclem%' 
AND id != 'VOTRE_ID_A_GARDER';
```

## Prévention

Pour éviter les doublons à l'avenir :
- Le système d'inscription crée une seule entreprise par utilisateur
- Vérifiez toujours avant de réexécuter des scripts SQL
- Utilisez des transactions pour les opérations critiques



