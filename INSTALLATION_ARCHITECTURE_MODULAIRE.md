# 🚀 INSTALLATION - Architecture Modulaire

**Date** : 2 Janvier 2026  
**Durée** : 15 minutes  
**Fichier SQL** : `database/create_modular_architecture.sql`

---

## ✅ CE QUI VA ÊTRE CRÉÉ

### 3 Nouvelles Structures

1. **Table `module_categories`** (8 catégories)
   - Core, Plateforme, Business, Finance, RH, Logistique, Gestion, Documents

2. **Table `modules` améliorée** (14 modules)
   - Ajout colonnes : category_id, display_name, icon, route, min_plan, status, etc.
   - Migration modules existants
   - Création nouveaux modules (CRM, Compta, RH, etc.)

3. **Table `subscription_plan_modules`** (liens plans ↔ modules)
   - Starter : 3 modules
   - Business : 10 modules
   - Premium : 13 modules

---

## 🔧 ÉTAPE 1 : EXÉCUTER LA MIGRATION SQL

### Dans Supabase

```
1. Ouvrir : https://supabase.com
2. Projet : Talosprime
3. Menu : SQL Editor
4. Cliquer : "New query"
5. Copier-coller le contenu COMPLET de :
   database/create_modular_architecture.sql
6. Cliquer : "Run" (ou Ctrl + Enter)
```

### Résultat Attendu

```
✅ 3 tables créées/modifiées
✅ 8 catégories insérées
✅ 14 modules créés/migrés
✅ ~40 liens plan-modules créés
✅ 2 fonctions SQL créées
✅ RLS configuré

Success. No rows returned
```

---

## ✅ ÉTAPE 2 : VÉRIFICATION

### Vérifier Catégories

```sql
SELECT * FROM module_categories ORDER BY order_index;
```

**Résultat attendu** : 8 lignes

| name | display_name | icon | is_platform_only |
|------|--------------|------|------------------|
| core | Core | Settings | false |
| platform | Plateforme | Crown | true |
| business | Business | Briefcase | false |
| finance | Finance | DollarSign | false |
| rh | Ressources Humaines | Users | false |
| logistique | Logistique | Package | false |
| gestion | Gestion | FolderKanban | false |
| documents | Documents | FileText | false |

---

### Vérifier Modules

```sql
SELECT 
  m.module_name,
  m.display_name,
  mc.display_name as category,
  m.status,
  m.min_plan,
  m.route
FROM modules m
LEFT JOIN module_categories mc ON m.category_id = mc.id
ORDER BY mc.order_index, m.order_index;
```

**Résultat attendu** : ~14 modules

---

### Vérifier Modules par Plan

```sql
-- Modules du plan Business
SELECT 
  m.display_name,
  spm.limits
FROM subscription_plan_modules spm
JOIN modules m ON m.module_name = spm.module_name
JOIN subscription_plans sp ON sp.id = spm.plan_id
WHERE sp.stripe_plan_name = 'Business'
AND spm.is_included = true;
```

---

## 🎯 CE QUI A CHANGÉ

### Avant

```
Table modules:
├── id
├── company_id
├── module_name
├── is_active
├── config
└── created_at
```

### Après

```
Table modules:
├── id
├── company_id
├── module_name
├── is_active
├── config
├── category_id          ← NOUVEAU
├── display_name         ← NOUVEAU
├── description          ← NOUVEAU
├── icon                 ← NOUVEAU
├── route                ← NOUVEAU
├── min_plan             ← NOUVEAU
├── status               ← NOUVEAU
├── order_index          ← NOUVEAU
├── default_limits       ← NOUVEAU
└── tags                 ← NOUVEAU
```

---

## 📊 MODULES CRÉÉS

### BUSINESS (4 modules)
- ✅ Leads (production)
- ✅ Onboarding (production)
- ✅ Facturation (production)
- 🟡 CRM (planned)

### FINANCE (2 modules)
- 🟡 Comptabilité (planned)
- 🟡 Trésorerie (planned)

### RH (3 modules)
- 🟡 Employés (planned)
- 🟡 Congés (planned)
- 🟡 Paie (planned)

### LOGISTIQUE (1 module)
- 🟡 Stock (planned)

### GESTION (2 modules)
- 🟡 Tâches (planned)
- 🟡 Projets (planned)

### DOCUMENTS (1 module)
- 🟡 GED (planned)

**Total** : 14 modules (3 production, 11 planned)

---

## 🎁 PACKS CONFIGURÉS

### Starter (29€)
```
✅ Leads (50/mois)
✅ Onboarding
✅ Tâches (100 max)
```

### Business (79€)
```
Tout Starter +
✅ Facturation (illimité)
✅ CRM (500 contacts)
✅ Employés (10 max)
✅ Congés
✅ Stock (1000 produits)
✅ Projets (10 max)
✅ Documents
```

### Premium (149€)
```
Tout Business +
✅ Comptabilité
✅ Trésorerie
✅ Paie
✅ Employés (20 max)
✅ CRM (illimité)
✅ Stock (illimité)
✅ Projets (illimité)
```

---

## 🔍 FONCTIONS SQL DISPONIBLES

### 1. Vérifier Accès Module

```sql
SELECT user_has_module_access(
  'user-uuid-here',
  'facturation'
);

-- Retourne: true ou false
```

### 2. Récupérer Modules d'un Plan

```sql
SELECT * FROM get_plan_modules('plan-uuid-here');

-- Retourne: liste modules avec limites
```

---

## ⚠️ EN CAS D'ERREUR

### Erreur: "relation already exists"

**Solution** : Normal si tables existent déjà. Le script utilise `IF NOT EXISTS`.

---

### Erreur: "column already exists"

**Solution** : Normal si colonnes existent déjà. Le script utilise `ADD COLUMN IF NOT EXISTS`.

---

### Erreur: "function does not exist"

**Cause** : Fonction `update_updated_at_column()` manquante

**Solution** :
```sql
-- Exécuter d'abord database/schema.sql
-- Ou créer la fonction:
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 PROCHAINES ÉTAPES

### Maintenant que la BDD est prête :

1. ✅ **API Routes** (2h)
   - `/api/platform/modules/categories`
   - `/api/platform/modules/by-category`
   - `/api/modules/available`

2. ✅ **Nouveau Sidebar** (3h)
   - Composant `SidebarModular.tsx`
   - Sections collapsibles
   - Filtrage dynamique

3. ✅ **Tests** (1h)
   - Vérifier affichage
   - Tester filtres par plan

---

## ✅ CHECKLIST

- [ ] Migration SQL exécutée dans Supabase
- [ ] 8 catégories visibles
- [ ] 14 modules créés/migrés
- [ ] Modules liés aux plans Starter/Business/Premium
- [ ] Fonctions SQL testées
- [ ] Aucune erreur dans les logs

**Si tout est ✅ → On passe aux API Routes !** 🚀

---

**Créé le** : 2 Janvier 2026  
**Temps d'installation** : ~15 minutes  
**Fichier** : `database/create_modular_architecture.sql`

