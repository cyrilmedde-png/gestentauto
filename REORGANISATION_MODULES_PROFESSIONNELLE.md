# 🏗️ RÉORGANISATION - Architecture Modulaire Professionnelle

**Date** : 2 Janvier 2026  
**Objectif** : Tout transformer en modules avec packs personnalisables

---

## 🎯 VISION

### Principe
**"Tout est un module"** - Chaque fonctionnalité = module activable/désactivable

### Avantages
✅ **Commercial** : Packs sur-mesure par client  
✅ **Scaling** : Ajout de modules sans toucher au core  
✅ **Maintenance** : Isolation des fonctionnalités  
✅ **UX** : Interface claire et organisée

---

## 📦 ARCHITECTURE MODULAIRE CIBLE

### Structure à 3 Niveaux

```
┌─────────────────────────────────────────────────┐
│         NIVEAU 1 : CORE PLATEFORME              │
│  (Toujours actif - Non désactivable)            │
│                                                  │
│  - Authentification                              │
│  - Dashboard                                     │
│  - Paramètres                                    │
│  - Gestion modules                               │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│      NIVEAU 2 : MODULES PLATEFORME              │
│  (Admin plateforme uniquement)                   │
│                                                  │
│  - Gestion Clients                               │
│  - Gestion Plans Stripe                          │
│  - Logs Système                                  │
│  - Analytics Globaux                             │
│  - Administrateurs                               │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│       NIVEAU 3 : MODULES MÉTIER                 │
│  (Activables par client selon pack)              │
│                                                  │
│  📊 Business                                     │
│    - Leads & Prospection                         │
│    - CRM                                         │
│    - Facturation                                 │
│    - Devis                                       │
│                                                  │
│  💰 Finance                                      │
│    - Comptabilité                                │
│    - Trésorerie                                  │
│    - Reporting Financier                         │
│                                                  │
│  👥 RH                                           │
│    - Gestion Employés                            │
│    - Paie                                        │
│    - Congés                                      │
│    - Recrutement                                 │
│                                                  │
│  📦 Logistique                                   │
│    - Stock                                       │
│    - Achats                                      │
│    - Fournisseurs                                │
│                                                  │
│  🎯 Gestion                                      │
│    - Projets                                     │
│    - Tâches                                      │
│    - Planning                                    │
│                                                  │
│  📄 Documents                                    │
│    - GED                                         │
│    - Signature électronique                      │
│    - Archivage                                   │
└─────────────────────────────────────────────────┘
```

---

## 📋 CATALOGUE MODULES COMPLET

### 🔐 CORE (Non-modulaire)

| Module | Description | Toujours actif |
|--------|-------------|----------------|
| Auth | Authentification Supabase | ✅ |
| Dashboard | Vue d'ensemble | ✅ |
| Settings | Paramètres entreprise | ✅ |
| Modules | Gestion modules | ✅ |

---

### 👑 PLATEFORME (Admin uniquement)

| Module | Route | Description | Statut |
|--------|-------|-------------|--------|
| **Clients** | `/platform/clients` | Gestion entreprises clientes | ✅ Existe |
| **Plans** | `/platform/plans` | Gestion plans Stripe | ✅ Existe |
| **Abonnements** | `/platform/subscriptions` | Suivi abonnements | ✅ Existe |
| **Modules** | `/platform/modules` | Activation modules | ✅ Existe |
| **Utilisateurs** | `/platform/users` | Gestion users globale | ✅ Existe |
| **Admins** | `/platform/admins` | Gestion admins plateforme | ✅ Existe |
| **Logs** | `/platform/logs` | Logs système | ✅ Existe |
| **Analytics** | `/platform/analytics` | Analytics globaux | ✅ Existe |
| **Settings** | `/platform/settings` | Config plateforme | ✅ Existe |

---

### 📊 BUSINESS (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **Leads** | `/leads` | Prospection & Leads | ✅ Existe | Starter |
| **Onboarding** | `/onboarding` | Onboarding clients | ✅ Existe | Starter |
| **CRM** | `/crm` | Relation client | ❌ À créer | Business |
| **Facturation** | `/facturation` | Devis & Factures | ✅ Existe (95%) | Business |
| **Devis** | `/devis` | Gestion devis | 🔄 Fusionné avec Facturation | Business |

---

### 💰 FINANCE (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **Comptabilité** | `/comptabilite` | Plan comptable, écritures | ❌ À créer | Premium |
| **Trésorerie** | `/tresorerie` | Suivi trésorerie | ❌ À créer | Premium |
| **Reporting** | `/reporting` | Rapports financiers | ❌ À créer | Premium |
| **Budget** | `/budget` | Gestion budgets | ❌ À créer | Enterprise |

---

### 👥 RH (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **Employés** | `/employes` | Gestion employés | ❌ À créer | Business |
| **Paie** | `/paie` | Bulletins de paie | ❌ À créer | Premium |
| **Congés** | `/conges` | Gestion congés | ❌ À créer | Business |
| **Recrutement** | `/recrutement` | Gestion recrutements | ❌ À créer | Enterprise |

---

### 📦 LOGISTIQUE (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **Stock** | `/stock` | Gestion stocks | ❌ À créer | Business |
| **Achats** | `/achats` | Gestion achats | ❌ À créer | Business |
| **Fournisseurs** | `/fournisseurs` | Gestion fournisseurs | ❌ À créer | Business |
| **Inventaire** | `/inventaire` | Inventaires | ❌ À créer | Premium |

---

### 🎯 GESTION (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **Projets** | `/projets` | Gestion projets | ❌ À créer | Business |
| **Tâches** | `/taches` | Gestion tâches | ❌ À créer | Starter |
| **Planning** | `/planning` | Planning équipe | ❌ À créer | Business |
| **Timesheet** | `/timesheet` | Suivi temps | ❌ À créer | Premium |

---

### 📄 DOCUMENTS (Modules métier)

| Module | Route | Description | Statut | Pack |
|--------|-------|-------------|--------|------|
| **GED** | `/documents` | Gestion documentaire | ❌ À créer | Business |
| **Signature** | `/signature` | Signature électronique | ❌ À créer | Premium |
| **Archivage** | `/archivage` | Archivage légal | ❌ À créer | Premium |

---

## 🎁 PACKS ABONNEMENTS STRIPE

### Pack 1 : STARTER (29€/mois)

```yaml
Modules inclus:
  Core:
    - Dashboard
    - Settings
  Business:
    - Leads (50 leads/mois)
    - Onboarding
  Gestion:
    - Tâches
  
Limites:
  - 1 utilisateur
  - 50 leads/mois
  - Support email
```

### Pack 2 : BUSINESS (79€/mois)

```yaml
Modules inclus:
  Tout STARTER +
  Business:
    - CRM (500 contacts)
    - Facturation (illimité)
  Finance:
    - (aucun)
  RH:
    - Employés (10 max)
    - Congés
  Logistique:
    - Stock (basique)
    - Achats
    - Fournisseurs
  Gestion:
    - Projets (10 max)
    - Planning
  
Limites:
  - 5 utilisateurs
  - 500 contacts CRM
  - Support prioritaire
```

### Pack 3 : PREMIUM (149€/mois)

```yaml
Modules inclus:
  Tout BUSINESS +
  Finance:
    - Comptabilité
    - Trésorerie
    - Reporting
  RH:
    - Paie
  Logistique:
    - Inventaire avancé
  Documents:
    - GED
    - Signature électronique
  Gestion:
    - Timesheet
  
Limites:
  - 20 utilisateurs
  - Illimité contacts
  - Support téléphone
```

### Pack 4 : ENTERPRISE (Sur-mesure)

```yaml
Modules inclus:
  TOUT +
  - Modules personnalisés
  - API dédiée
  - Intégrations sur-mesure
  - Formations
  
Limites:
  - Illimité utilisateurs
  - Déploiement dédié (optionnel)
  - Account manager
  - SLA 99.9%
```

---

## 🎨 INTERFACE - SIDEBAR RÉORGANISÉE

### Version ADMIN PLATEFORME

```
┌─────────────────────────────────┐
│  TALOS PRIME                    │
├─────────────────────────────────┤
│                                 │
│  🏠 Dashboard                   │
│                                 │
│  ▼ 👑 PLATEFORME               │
│     📊 Clients                  │
│     💳 Plans & Abonnements      │
│     📦 Gestion Modules          │
│     👥 Utilisateurs             │
│     🛡️  Administrateurs         │
│     📋 Logs Système             │
│     📈 Analytics                │
│     ⚙️  Paramètres              │
│                                 │
│  ▼ 📊 BUSINESS                 │
│     🎯 Leads                    │
│     🚀 Onboarding               │
│     👥 CRM                      │
│     📄 Facturation              │
│                                 │
│  ▼ 💰 FINANCE                  │
│     📚 Comptabilité             │
│     💵 Trésorerie               │
│     📊 Reporting                │
│                                 │
│  ▼ 👥 RH                       │
│     👤 Employés                 │
│     💰 Paie                     │
│     🏖️  Congés                  │
│                                 │
│  ▼ 📦 LOGISTIQUE               │
│     📦 Stock                    │
│     🛒 Achats                   │
│     🏭 Fournisseurs             │
│                                 │
│  ▼ 🎯 GESTION                  │
│     📁 Projets                  │
│     ✅ Tâches                   │
│     📅 Planning                 │
│                                 │
│  ▼ 📄 DOCUMENTS                │
│     📚 GED                      │
│     ✍️  Signature               │
│                                 │
│  ⚙️  Paramètres                │
│  🚪 Déconnexion                │
└─────────────────────────────────┘
```

**Sections collapsibles** : Clic sur ▼ pour expand/collapse

---

### Version CLIENT (Selon modules activés)

```
┌─────────────────────────────────┐
│  MON ENTREPRISE                 │
├─────────────────────────────────┤
│                                 │
│  🏠 Dashboard                   │
│                                 │
│  📊 BUSINESS                   │
│     🎯 Leads                   │ ← Si module actif
│     📄 Facturation             │ ← Si module actif
│                                 │
│  🎯 GESTION                    │
│     ✅ Tâches                  │ ← Si module actif
│     📁 Projets                 │ ← Si module actif
│                                 │
│  ⚙️  Paramètres                │
│  🚪 Déconnexion                │
└─────────────────────────────────┘
```

**Affichage dynamique** : Seulement les catégories avec modules actifs

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### 1. Schéma Base de Données

#### Table `module_categories`

```sql
CREATE TABLE module_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,        -- 'business', 'finance', 'rh'...
  display_name VARCHAR(100) NOT NULL,       -- 'Business', 'Finance', 'RH'
  icon VARCHAR(50) NOT NULL,                -- 'Briefcase', 'DollarSign'...
  order_index INTEGER NOT NULL,             -- Ordre affichage
  is_platform_only BOOLEAN DEFAULT false,   -- Réservé admin plateforme
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table `modules` (Mise à jour)

```sql
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES module_categories(id);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS min_plan VARCHAR(50); -- 'starter', 'business', 'premium'
```

#### Table `subscription_plan_modules`

```sql
CREATE TABLE subscription_plan_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  is_included BOOLEAN DEFAULT true,
  limits JSONB,  -- Ex: { "max_contacts": 500, "max_users": 5 }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, module_name)
);
```

---

### 2. API Routes à Créer

```typescript
// GET /api/platform/modules/categories
// Liste toutes les catégories

// GET /api/platform/modules/by-category
// Modules groupés par catégorie

// GET /api/modules/available
// Modules disponibles pour l'utilisateur selon son plan

// POST /api/platform/plans/[id]/modules
// Configurer modules inclus dans un plan
```

---

### 3. Composant Sidebar Réorganisé

```typescript
// components/layout/SidebarModular.tsx

interface SidebarSection {
  category: {
    id: string
    name: string
    displayName: string
    icon: LucideIcon
    isPlatformOnly: boolean
  }
  modules: Module[]
  isCollapsed: boolean
}

function SidebarModular() {
  const { user, isPlatform } = useAuth()
  const [sections, setSections] = useState<SidebarSection[]>([])
  
  // Charger modules groupés par catégorie
  useEffect(() => {
    loadModules()
  }, [])
  
  const loadModules = async () => {
    const response = await fetch('/api/platform/modules/by-category')
    const data = await response.json()
    
    // Filtrer selon isPlatform
    const filtered = data.categories.filter(cat => 
      isPlatform || !cat.isPlatformOnly
    )
    
    setSections(filtered)
  }
  
  return (
    <aside>
      {sections.map(section => (
        <SidebarSection
          key={section.category.id}
          category={section.category}
          modules={section.modules}
        />
      ))}
    </aside>
  )
}
```

---

## 📅 PLAN D'ACTION

### Phase 1 : Réorganisation Base (1 semaine)

#### Jour 1-2 : Structure BDD
- [ ] Créer table `module_categories`
- [ ] Migrer table `modules` (ajouter colonnes)
- [ ] Créer table `subscription_plan_modules`
- [ ] Insérer catégories par défaut
- [ ] Migrer modules existants

#### Jour 3-4 : API Routes
- [ ] `/api/platform/modules/categories`
- [ ] `/api/platform/modules/by-category`
- [ ] `/api/modules/available`
- [ ] Mise à jour `/api/platform/modules/available`

#### Jour 5-7 : Interface
- [ ] Nouveau composant `SidebarModular.tsx`
- [ ] Sections collapsibles
- [ ] Filtrage dynamique selon plan
- [ ] Tests responsive

---

### Phase 2 : Configuration Packs (3 jours)

#### Jour 1 : Packs Stripe
- [ ] Créer plans Starter/Business/Premium dans Stripe
- [ ] Lier modules aux plans

#### Jour 2 : Interface Config
- [ ] Page `/platform/plans/[id]/modules`
- [ ] Gestion modules par plan
- [ ] Checkboxes + limites

#### Jour 3 : Validation
- [ ] Vérification accès modules selon plan
- [ ] Middleware validation
- [ ] Messages d'erreur clairs

---

### Phase 3 : Migration Modules Existants (2 jours)

#### Leads
- [ ] Migrer `/platform/leads` → `/leads`
- [ ] Ajouter à catégorie "Business"
- [ ] Lier à pack "Starter"

#### Facturation
- [ ] Déjà OK `/facturation`
- [ ] Ajouter à catégorie "Business"
- [ ] Lier à pack "Business"

#### Onboarding
- [ ] Migrer `/platform/onboarding` → `/onboarding`
- [ ] Ajouter à catégorie "Business"
- [ ] Lier à pack "Starter"

---

### Phase 4 : Nouveaux Modules (Progressif)

**Mois 1** : CRM
- [ ] Schéma BDD (contacts, deals, opportunités)
- [ ] API CRUD
- [ ] Interface liste/détails
- [ ] Workflows N8N

**Mois 2** : RH Basique
- [ ] Employés + Congés
- [ ] API + Interface

**Mois 3** : Comptabilité
- [ ] Plan comptable
- [ ] Écritures

---

## 🎯 RÉSULTAT FINAL

### Avantages

✅ **Commercial**
- Packs clairs (Starter, Business, Premium, Enterprise)
- Upsell facile (activer module = upgrade plan)
- Devis personnalisés

✅ **Technique**
- Code modulaire isolé
- Ajout modules sans casser l'existant
- Scaling horizontal

✅ **UX**
- Interface claire et organisée
- Pas de surcharge visuelle
- Navigation intuitive

✅ **Professionnel**
- Réponse rapide aux demandes clients
- Configuration flexible
- Image de marque premium

---

## 🚀 DÉMARRAGE IMMÉDIAT

### Commençons par quoi ?

**Option A : Structure BDD d'abord** (Recommandé)
- Créer les 3 tables
- Migrer modules existants
- Base solide pour la suite

**Option B : Interface d'abord** (Visuel rapide)
- Nouveau Sidebar avec sections
- Mock data
- Voir le résultat immédiatement

**Option C : Les deux en parallèle** (Rapide)
- BDD + Interface en même temps
- Démo fonctionnelle en 2 jours

---

**Quelle option préférez-vous pour démarrer ?** 🚀

