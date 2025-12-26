# Gestion des accès N8N pour les administrateurs plateforme

## Vue d'ensemble

La table `platform_n8n_access` permet de gérer de manière granulaire les accès à N8N pour les administrateurs de la plateforme. Cette approche offre plus de flexibilité que la simple vérification par `company_id`.

## Installation

### Étape 1 : Créer la table

Exécutez le script SQL dans Supabase SQL Editor :

```sql
-- Fichier : database/create_platform_n8n_access.sql
```

Ce script crée :
- La table `platform_n8n_access`
- Les index pour la performance
- Les politiques RLS (Row Level Security)
- Le trigger pour `updated_at`

### Étape 2 : Insérer l'administrateur principal

Exécutez le script SQL dans Supabase SQL Editor :

```sql
-- Fichier : database/insert_platform_n8n_admin.sql
```

Ce script :
- Trouve automatiquement l'utilisateur par email (`groupemclem@gmail.com`)
- Trouve le `platform_company_id` depuis `settings`
- Insère ou met à jour l'accès N8N pour l'administrateur principal

## Structure de la table

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Référence vers `users.id` (UNIQUE) |
| `company_id` | UUID | Référence vers `companies.id` (plateforme) |
| `is_platform_admin` | BOOLEAN | Est administrateur plateforme |
| `has_n8n_access` | BOOLEAN | A accès à N8N (peut être désactivé) |
| `access_level` | VARCHAR(50) | Niveau d'accès : `admin`, `editor`, `viewer` |
| `notes` | TEXT | Notes sur l'accès |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |
| `created_by` | UUID | Utilisateur qui a créé l'accès |
| `updated_by` | UUID | Utilisateur qui a modifié l'accès |

## Niveaux d'accès

- **`admin`** : Accès complet (création, modification, suppression de workflows)
- **`editor`** : Peut modifier les workflows existants
- **`viewer`** : Accès en lecture seule

## Fonctionnement dans le code

La fonction `verifyPlatformUser` vérifie maintenant dans cet ordre :

1. **MÉTHODE 1 (Prioritaire)** : Vérifie dans `platform_n8n_access`
   - Si l'utilisateur est dans la table ET `has_n8n_access = true`
   - ET que son `company_id` correspond au `platform_company_id`
   - → Accès autorisé ✅

2. **MÉTHODE 2 (Fallback)** : Vérifie par `company_id`
   - Compare `user.company_id` avec `platform_company_id` depuis `settings`
   - → Accès autorisé si correspondance ✅

## Ajouter un nouvel administrateur N8N

```sql
INSERT INTO platform_n8n_access (
  user_id,
  company_id,
  is_platform_admin,
  has_n8n_access,
  access_level,
  notes
) VALUES (
  'UUID_DE_L_UTILISATEUR',  -- Récupérer depuis users.id
  'UUID_PLATEFORME',         -- Récupérer depuis settings WHERE key = 'platform_company_id'
  true,                      -- Est admin plateforme
  true,                      -- A accès N8N
  'admin',                   -- Niveau d'accès
  'Description de l''accès'
);
```

## Désactiver l'accès N8N (sans supprimer)

```sql
UPDATE platform_n8n_access
SET 
  has_n8n_access = false,
  updated_at = NOW()
WHERE user_id = 'UUID_DE_L_UTILISATEUR';
```

## Réactiver l'accès N8N

```sql
UPDATE platform_n8n_access
SET 
  has_n8n_access = true,
  updated_at = NOW()
WHERE user_id = 'UUID_DE_L_UTILISATEUR';
```

## Voir tous les accès N8N configurés

```sql
SELECT 
  pna.id,
  pna.user_id,
  u.email,
  u.first_name,
  u.last_name,
  pna.company_id,
  c.name as company_name,
  pna.is_platform_admin,
  pna.has_n8n_access,
  pna.access_level,
  pna.notes,
  pna.created_at,
  pna.updated_at
FROM platform_n8n_access pna
LEFT JOIN users u ON pna.user_id = u.id
LEFT JOIN companies c ON pna.company_id = c.id
ORDER BY pna.created_at DESC;
```

## Avantages de cette approche

1. ✅ **Contrôle granulaire** : Gestion séparée des accès N8N
2. ✅ **Plusieurs administrateurs** : Plusieurs utilisateurs peuvent avoir accès
3. ✅ **Niveaux d'accès** : Différents niveaux (admin/editor/viewer)
4. ✅ **Activation/Désactivation** : Peut désactiver sans supprimer
5. ✅ **Audit** : Traçabilité des accès (created_by, updated_by)
6. ✅ **Notes** : Commentaires sur chaque accès
7. ✅ **Flexibilité** : Peut évoluer selon les besoins

## Sécurité

- **RLS activé** : Seuls les utilisateurs plateforme peuvent voir/modifier cette table
- **Vérification double** : Vérifie à la fois la présence dans la table ET le `company_id`
- **Isolation** : Les clients ne peuvent pas accéder à cette table

## Migration depuis l'ancienne méthode

Si vous aviez déjà des utilisateurs plateforme qui accédaient à N8N via la vérification par `company_id`, ils continueront de fonctionner grâce au fallback (MÉTHODE 2). Pour une meilleure gestion, ajoutez-les dans `platform_n8n_access`.



