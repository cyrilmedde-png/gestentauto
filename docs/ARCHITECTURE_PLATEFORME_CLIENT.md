# 🏗️ Architecture Plateforme / Client - Documentation Complète

## 📋 Vue d'ensemble

L'application est divisée en deux couches distinctes avec isolation stricte des données :

### 1. **Couche PLATEFORME** (Backend)
- Gestion des clients (onboarding, facturation)
- Administration système
- Données d'onboarding (leads, questionnaires, entretiens, essais)
- **Accès** : Utilisateurs avec `company_id = platform_company_id`

### 2. **Couche CLIENT** (Frontend métier)
- Application métier complète (CRM, Facturation, Comptabilité, etc.)
- Données isolées par entreprise (`company_id`)
- **Accès** : Utilisateurs avec `company_id != platform_company_id`

---

## 🗄️ Structure des données

### Tables PLATEFORME uniquement (pas de `company_id`)

Ces tables appartiennent exclusivement à la plateforme :

| Table | Description | Accès |
|-------|-------------|-------|
| `leads` | Pré-inscriptions d'onboarding | Plateforme uniquement |
| `onboarding_questionnaires` | Questionnaires de besoins | Plateforme uniquement |
| `onboarding_interviews` | Entretiens planifiés | Plateforme uniquement |
| `trials` | Essais gratuits | Plateforme uniquement (a `company_id` pour lier à l'entreprise créée) |

**RLS Policy** : `USING (public.is_platform_user())`

### Tables CLIENT (avec `company_id`)

Ces tables contiennent les données métier des clients :

| Table | Description | Visibilité Plateforme | Visibilité Client |
|-------|-------------|----------------------|-------------------|
| `companies` | Entreprises | ✅ Toutes | ❌ Uniquement la sienne |
| `users` | Utilisateurs | ✅ Tous | ❌ Uniquement son entreprise |
| `roles` | Rôles | ✅ Tous | ❌ Uniquement son entreprise |
| `modules` | Modules activés | ✅ Tous | ❌ Uniquement son entreprise |
| `settings` | Paramètres | ✅ Tous | ❌ Uniquement son entreprise |
| `customers` | Clients CRM (futur) | ❌ Aucun | ✅ Uniquement son entreprise |
| `invoices` | Factures (futur) | ❌ Aucun | ✅ Uniquement son entreprise |

**RLS Policy** :
- Plateforme : `USING (public.is_platform_user())`
- Client : `USING (company_id = public.user_company_id())`

---

## 🔐 Règles d'accès

### Plateforme peut voir :
✅ **Toutes les entreprises clients** (liste des `companies` sauf la plateforme)  
✅ **Tous les utilisateurs** (liste des `users` de toutes les entreprises)  
✅ **Tous les leads** (données d'onboarding)  
✅ **Tous les questionnaires, entretiens, essais**  
❌ **PAS les données métier des clients** (customers, invoices, etc. - à venir)

### Client peut voir :
✅ **Sa propre entreprise** (`companies` où `id = user.company_id`)  
✅ **Les utilisateurs de son entreprise** (`users` où `company_id = user.company_id`)  
✅ **Ses propres données métier** (customers, invoices, etc. avec `company_id = user.company_id`)  
❌ **PAS les leads** (données plateforme)  
❌ **PAS les autres entreprises**  
❌ **PAS les données de la plateforme**

---

## 🛠️ Implémentation technique

### Clients Supabase

#### 1. `createPlatformClient()` - Service Role Key
**Utilisation** : Routes API `/api/platform/*`  
**Accès** : Bypasse les RLS (accès total)  
**Filtrage** : Manuel dans le code pour exclure les données métier des clients

```typescript
// lib/supabase/platform.ts
export function createPlatformClient() {
  return createClient(
    supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY, // Service role = bypass RLS
    { auth: { persistSession: false } }
  )
}
```

#### 2. `createClientTampon()` - Anon Key avec RLS
**Utilisation** : Routes API `/api/client/*` (futur)  
**Accès** : Respecte les RLS automatiquement  
**Filtrage** : Automatique par RLS selon `company_id`

```typescript
// lib/supabase/client-tampon.ts
export function createClientTampon() {
  return createClient(
    supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY, // Anon key = respecte RLS
    { auth: { persistSession: false } }
  )
}
```

#### 3. `supabase` (client standard) - Anon Key
**Utilisation** : Frontend React (côté client uniquement)  
**Accès** : Respecte les RLS automatiquement  
**Note** : Le frontend ne doit JAMAIS faire d'appels directs à Supabase, toujours passer par les routes API

---

## 📡 Routes API

### Routes Plateforme (`/api/platform/*`)

Toutes les routes plateforme :
- Utilisent `createPlatformClient()` (service role)
- Bypassent les RLS
- Doivent filtrer manuellement pour ne pas exposer les données métier des clients

**Exemples** :
- `GET /api/platform/leads` - Liste tous les leads
- `GET /api/platform/companies` - Liste toutes les entreprises clients
- `GET /api/platform/users` - Liste tous les utilisateurs

### Routes Client (`/api/client/*`) - À créer

Ces routes seront créées quand les modules métier seront implémentés :
- Utilisent `createClientTampon()` (anon key)
- Respectent automatiquement les RLS
- Les clients ne voient que leurs données

**Exemples futurs** :
- `GET /api/client/customers` - Liste les clients CRM de l'entreprise
- `GET /api/client/invoices` - Liste les factures de l'entreprise

---

## 🔒 Sécurité

### Protection des routes

#### Frontend
- `ProtectedPlatformRoute` : Vérifie que l'utilisateur est plateforme avant d'afficher les routes `/platform/*`
- `ProtectedRoute` : Vérifie que l'utilisateur est authentifié

#### Backend (API Routes)
- Les routes `/api/platform/*` doivent vérifier que l'utilisateur est plateforme
- Les routes `/api/client/*` vérifient automatiquement via RLS

### RLS Policies

Toutes les tables ont des RLS policies qui :
1. Vérifient si l'utilisateur est plateforme (`is_platform_user()`)
2. Si non, vérifient que `company_id = user_company_id()`

---

## 🧪 Tests de vérification

### 1. Vérifier que vous êtes détecté comme plateforme

```sql
SELECT 
  u.id,
  u.email,
  u.company_id,
  public.is_platform_user() as is_platform,
  (SELECT value#>>'{}' FROM settings WHERE key = 'platform_company_id') as platform_id
FROM users u
WHERE u.email = 'votre-email@example.com';
```

Résultat attendu : `is_platform = true`

### 2. Vérifier l'accès aux leads

```sql
-- En tant qu'utilisateur plateforme, vous devriez voir tous les leads
SELECT COUNT(*) FROM leads;
```

### 3. Vérifier que les clients ne voient pas les leads

Avec un compte client, cette requête doit retourner 0 ou une erreur :
```sql
SELECT COUNT(*) FROM leads;
```

---

## 📝 Checklist de déploiement

- [ ] Exécuter `fix_rls_leads_platform.sql` dans Supabase
- [ ] Vérifier que `is_platform_user()` fonctionne
- [ ] Vérifier que `platform_company_id` est correctement défini
- [ ] Tester l'accès aux leads en tant que plateforme
- [ ] Tester que les clients ne peuvent pas accéder aux leads
- [ ] Vérifier que les routes API utilisent le bon client
- [ ] Vérifier que le frontend utilise toujours les routes API (jamais d'appels directs)

---

## 🚨 Points critiques

1. **Les leads sont PLATEFORME uniquement** - Les clients ne doivent JAMAIS y accéder
2. **Le frontend doit TOUJOURS passer par les routes API** - Jamais d'appels directs Supabase
3. **Les routes API plateforme bypassent les RLS** - Elles doivent filtrer manuellement
4. **Les routes API client respectent les RLS** - Filtrage automatique par `company_id`


