# 🚀 DÉPLOIEMENT - Architecture Modulaire

**Date** : 2 Janvier 2026  
**Durée totale** : 30 minutes  
**Statut** : ✅ Code prêt

---

## ✅ CE QUI A ÉTÉ CRÉÉ

### 1️⃣ **Base de Données** (1 fichier SQL)
```
database/create_modular_architecture.sql
├── Table module_categories (8 catégories)
├── Table modules (14 modules)
├── Table subscription_plan_modules
├── 2 Fonctions SQL
└── RLS complet
```

### 2️⃣ **API Routes** (3 routes)
```
app/api/
├── platform/modules/categories/route.ts
├── platform/modules/by-category/route.ts
└── modules/available/route.ts
```

### 3️⃣ **Interface** (1 composant)
```
components/layout/SidebarModular.tsx
├── Sections collapsibles
├── Groupement par catégories
├── Filtrage dynamique
└── Responsive mobile
```

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### ÉTAPE 1 : Installer Base de Données (10 min)

#### 1.1 Connexion Supabase

```
https://supabase.com
→ Projet Talosprime
→ SQL Editor
→ New query
```

#### 1.2 Exécuter Migration

**Copier-coller** le contenu COMPLET de :
```
database/create_modular_architecture.sql
```

Puis **Run** (Ctrl + Enter)

#### 1.3 Vérification

```sql
-- Vérifier catégories créées
SELECT COUNT(*) FROM module_categories;
-- Attendu: 8

-- Vérifier modules créés
SELECT COUNT(*) FROM modules;
-- Attendu: ~14+

-- Vérifier que category_id existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'modules' 
AND column_name = 'category_id';
-- Attendu: 1 ligne
```

✅ **BDD installée !**

---

### ÉTAPE 2 : Tester API Routes (5 min)

#### Test 1 : Catégories

```bash
curl https://www.talosprimes.com/api/platform/modules/categories
```

**Résultat attendu** :
```json
{
  "success": true,
  "categories": [
    {
      "id": "...",
      "name": "core",
      "display_name": "Core",
      "icon": "Settings",
      "color": "#6366f1",
      ...
    },
    ...
  ]
}
```

#### Test 2 : Modules par catégorie

```bash
curl https://www.talosprimes.com/api/platform/modules/by-category
```

**Résultat attendu** :
```json
{
  "success": true,
  "categories": [
    {
      "name": "business",
      "display_name": "Business",
      "modules": [...],
      "modules_count": 4
    },
    ...
  ],
  "total_modules": 14
}
```

#### Test 3 : Modules disponibles (nécessite auth)

```bash
# Via navigateur (connecté)
https://www.talosprimes.com/api/modules/available
```

✅ **APIs fonctionnelles !**

---

### ÉTAPE 3 : Activer Nouveau Sidebar (10 min)

#### Option A : Remplacement Direct

**Fichier** : `components/layout/MainLayout.tsx`

**Remplacer** :
```typescript
import { Sidebar } from './Sidebar'
```

**Par** :
```typescript
import { SidebarModular } from './SidebarModular'
```

**Et dans le JSX, remplacer** :
```typescript
<Sidebar />
```

**Par** :
```typescript
<SidebarModular />
```

---

#### Option B : Test Côte à Côte (Recommandé)

Garder les deux sidebars et tester :

```typescript
// components/layout/MainLayout.tsx

'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { SidebarModular } from './SidebarModular'
import { SidebarProvider } from './SidebarContext'
import { HeaderProvider } from './HeaderContext'

export function MainLayout({ children }: { children: React.ReactNode }) {
  // Toggle pour tester
  const [useModularSidebar, setUseModularSidebar] = useState(true)

  return (
    <SidebarProvider>
      <HeaderProvider>
        <div className="flex min-h-screen bg-background">
          {/* Utiliser nouveau ou ancien selon toggle */}
          {useModularSidebar ? <SidebarModular /> : <Sidebar />}
          
          <div className="flex-1 flex flex-col ml-20">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </HeaderProvider>
    </SidebarProvider>
  )
}
```

Ensuite, tester et si OK, supprimer l'ancien Sidebar.

---

### ÉTAPE 4 : Build & Deploy (5 min)

#### 4.1 Build Local (Test)

```bash
npm run build
```

**Vérifier** : Aucune erreur TypeScript

#### 4.2 Test Local

```bash
npm run dev
```

**Ouvrir** : `http://localhost:3000`

**Vérifier** :
- ✅ Sidebar s'affiche
- ✅ Sections collapsibles fonctionnent
- ✅ Modules groupés par catégorie
- ✅ Navigation fonctionne

#### 4.3 Déploiement VPS

```bash
# SSH
ssh root@62.171.152.132

# Naviguer projet
cd /var/www/talosprime

# Pull code
git pull origin main

# Build
npm run build

# Restart
pm2 restart talosprime

# Vérifier
pm2 status
```

✅ **Déployé !**

---

## 🎨 RÉSULTAT VISUEL

### Nouveau Sidebar

```
┌─────────────────────────────┐
│      TALOS PRIME           │
├─────────────────────────────┤
│                             │
│  ▼ 👑 Plateforme           │
│     📊 Clients              │
│     💳 Plans                │
│     📦 Modules              │
│                             │
│  ▼ 📊 Business             │
│     🎯 Leads                │
│     🚀 Onboarding           │
│     📄 Facturation          │
│     👥 CRM                  │
│                             │
│  ▼ 💰 Finance              │
│     📚 Comptabilité         │
│     💵 Trésorerie           │
│                             │
│  ▼ 👥 RH                   │
│     👤 Employés             │
│     🏖️  Congés              │
│     💰 Paie                 │
│                             │
│  🚪 Déconnexion             │
└─────────────────────────────┘
```

**Features** :
- ✅ Clic sur ▼ = collapse/expand section
- ✅ Auto-collapse au survol (desktop)
- ✅ Drawer mobile
- ✅ Highlight route active
- ✅ Icônes colorées par catégorie

---

## 🔍 TESTS À EFFECTUER

### Test 1 : Catégories Visibles

- [ ] Voir section "Plateforme" (si admin)
- [ ] Voir section "Business"
- [ ] Voir section "Finance"
- [ ] Voir section "RH"

### Test 2 : Collapse/Expand

- [ ] Cliquer sur chevron → Section se ferme
- [ ] Re-cliquer → Section s'ouvre

### Test 3 : Navigation

- [ ] Cliquer sur "Leads" → Route `/leads`
- [ ] Cliquer sur "Facturation" → Route `/facturation`
- [ ] Lien actif = highlight bleu

### Test 4 : Responsive

- [ ] Desktop : Sidebar auto-collapse au survol
- [ ] Mobile : Bouton hamburger visible
- [ ] Mobile : Sidebar = drawer qui slide

### Test 5 : Permissions

- [ ] Admin plateforme = voir toutes catégories
- [ ] Client = voir uniquement ses modules actifs

---

## ⚠️ PROBLÈMES POTENTIELS

### "Module_categories not found"

**Cause** : Migration SQL non exécutée

**Solution** : Exécuter `database/create_modular_architecture.sql`

---

### "Cannot read property 'display_name'"

**Cause** : Modules sans category_id

**Solution** :
```sql
-- Vérifier modules orphelins
SELECT * FROM modules WHERE category_id IS NULL;

-- Les assigner à une catégorie
UPDATE modules 
SET category_id = (SELECT id FROM module_categories WHERE name = 'business')
WHERE module_name IN ('leads', 'facturation', 'crm');
```

---

### Sidebar vide

**Cause** : Aucun module actif pour l'entreprise

**Solution** :
```sql
-- Activer modules pour une entreprise
UPDATE modules 
SET is_active = true 
WHERE company_id = 'your-company-id'
AND module_name IN ('leads', 'onboarding', 'facturation');
```

---

### Erreur "is_platform_user does not exist"

**Cause** : Fonction SQL manquante

**Solution** : Exécuter d'abord `database/schema.sql` ou créer manuellement la fonction

---

## 📊 CHECKLIST FINALE

### Base de Données
- [ ] `module_categories` existe (8 lignes)
- [ ] `modules` a colonne `category_id`
- [ ] Modules liés aux catégories
- [ ] Fonctions SQL créées

### API Routes
- [ ] `/api/platform/modules/categories` → 200
- [ ] `/api/platform/modules/by-category` → 200
- [ ] `/api/modules/available` → 200

### Interface
- [ ] `SidebarModular.tsx` créé
- [ ] Importé dans `MainLayout.tsx`
- [ ] Sections collapsibles fonctionnent
- [ ] Navigation OK

### Déploiement
- [ ] Build sans erreurs
- [ ] Tests locaux OK
- [ ] Déployé sur VPS
- [ ] PM2 status = online

---

## 🎉 TERMINÉ !

Vous avez maintenant une **architecture modulaire professionnelle** !

### Prochaines Étapes

1. ✅ **Créer modules manquants** (CRM, Compta, etc.)
2. ✅ **Configurer packs Stripe** (Starter, Business, Premium)
3. ✅ **Développer pages modules**
4. ✅ **Workflows N8N par module**

---

**Créé le** : 2 Janvier 2026  
**Temps total** : 30 minutes  
**Version** : 1.0


