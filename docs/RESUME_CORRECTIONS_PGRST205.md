# ✅ Résumé des corrections - Erreur PGRST205

## Problème identifié

L'application crashait en boucle avec l'erreur :
```
code: 'PGRST205'
message: "Could not find the table 'public.leads' in the schema cache"
```

## Corrections appliquées

### 1. Détection automatique améliorée

Le code essaie maintenant automatiquement les deux noms de tables dans l'ordre :
1. `platform_leads` (nouveau nom après migration)
2. `leads` (ancien nom)

### 2. Gestion de l'erreur PGRST205

Le code détecte spécifiquement l'erreur PGRST205 et essaie automatiquement avec l'autre nom de table.

### 3. Logs améliorés

- Logs informatifs pour indiquer quelle table est utilisée
- Logs d'erreur détaillés avec code, message et hint
- Messages d'erreur clairs pour l'utilisateur

### 4. Prévention des crashes

Le code retourne maintenant une erreur HTTP 500 propre au lieu de faire crash l'application, ce qui évite les restarts en boucle de PM2.

## Scripts SQL créés

1. **`database/diagnostic_tables.sql`** : Script pour diagnostiquer l'état des tables
2. **`database/migration_platform_client_naming.sql`** : Migration des noms de tables
3. **`database/create_client_tables.sql`** : Création des tables client
4. **`database/update_rls_platform_tables.sql`** : Mise à jour des RLS policies

## Prochaines étapes

### Étape 1 : Diagnostiquer l'état actuel

Exécuter dans Supabase SQL Editor :
```sql
-- Voir database/diagnostic_tables.sql
```

Ce script va :
- Lister toutes les tables contenant "lead"
- Indiquer quelles tables existent
- Vérifier les RLS policies
- Donner des recommandations

### Étape 2 : Redéployer l'application

```bash
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart all
```

### Étape 3 : Vérifier les logs

```bash
pm2 logs talosprime --lines 100
```

Vous devriez voir soit :
- ✅ `Using legacy table name "leads"` (si la table leads existe)
- ❌ Une erreur claire indiquant qu'aucune table n'existe (avec instructions)

### Étape 4 : Résoudre selon le diagnostic

**Si aucune table n'existe :**
- Exécuter `database/schema_onboarding.sql` pour créer la table `leads`
- Puis exécuter `database/migration_platform_client_naming.sql` pour la renommer

**Si `leads` existe mais pas `platform_leads` :**
- Exécuter `database/migration_platform_client_naming.sql` pour renommer

**Si `platform_leads` existe :**
- L'application devrait fonctionner normalement

## Résultat attendu

Après ces corrections :
- ✅ L'application ne crash plus en boucle
- ✅ Les erreurs sont claires et informatives
- ✅ Le code fonctionne avec les deux noms de tables
- ✅ Les logs permettent de diagnostiquer facilement

## Documentation

- `docs/FIX_PGRST205_ERROR.md` : Guide détaillé pour résoudre l'erreur PGRST205
- `docs/GUIDE_MIGRATION_SQL.md` : Guide d'exécution des scripts SQL
- `database/diagnostic_tables.sql` : Script de diagnostic







