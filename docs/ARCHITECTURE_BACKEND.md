# Architecture Backend - Séparation Plateforme / Client

## Vue d'ensemble

Le backend est maintenant séparé en deux parties distinctes :
- **Backend Plateforme** : Pour la gestion de la plateforme SaaS
- **Backend Client** : Pour les opérations des entreprises clientes (à venir)

Chaque partie utilise son propre "tampon" (client Supabase) pour une isolation complète.

## Structure des fichiers

```
lib/
  supabase/
    client.ts              # Client côté client (React)
    server.ts              # Client serveur générique
    platform.ts            # Client tampon PLATEFORME ⭐
    client-tampon.ts       # Client tampon CLIENT ⭐
    
  platform/                # Utilitaires plateforme
    supabase.ts            # Helpers Supabase plateforme
    
  client/                  # Utilitaires client (futur)
    (à créer)

app/api/
  platform/                # APIs plateforme uniquement ⭐
    companies/             # Gestion des entreprises clientes
    users/                 # Gestion des utilisateurs clients
    stats/                 # Statistiques plateforme
    
  client/                  # APIs client (futur)
    (à créer)
    
  auth/                    # Auth partagée
    register/
    login/
    
  settings/                # Routes de compatibilité (deprecated)
    clients/               # → Utiliser /api/platform/companies
    platform/              # → Conservée pour le frontend
```

## Clients Supabase (Tampons)

### 1. Client Plateforme (`lib/supabase/platform.ts`)

**Utilisation** : Routes API `/api/platform/*`

**Caractéristiques** :
- Utilise `SUPABASE_SERVICE_ROLE_KEY`
- Bypass toutes les RLS policies
- Accès complet à toutes les données
- Ne doit JAMAIS être utilisé côté client

**Exemple** :
```typescript
import { createPlatformClient } from '@/lib/supabase/platform'

const supabase = createPlatformClient()
// Accès à toutes les données
```

### 2. Client Tampon Client (`lib/supabase/client-tampon.ts`)

**Utilisation** : Routes API `/api/client/*` (futur)

**Caractéristiques** :
- Utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Respecte les RLS policies
- Isolation par `company_id`
- Pour les opérations des entreprises clientes

**Exemple** (futur) :
```typescript
import { createClientTampon } from '@/lib/supabase/client-tampon'

const supabase = createClientTampon()
// Respecte les RLS, isolation par company_id
```

## APIs Plateforme

### `/api/platform/companies`

**GET** `/api/platform/companies`
- Liste toutes les entreprises clientes
- Exclut la plateforme elle-même
- Retourne : `{ companies: [...] }`

**GET** `/api/platform/companies/[id]`
- Détails d'une entreprise cliente
- Vérifie que ce n'est pas la plateforme

**PATCH** `/api/platform/companies/[id]`
- Met à jour une entreprise cliente
- Ne permet pas de modifier la plateforme

### `/api/platform/users`

**GET** `/api/platform/users?company_id=xxx`
- Liste tous les utilisateurs des clients
- Optionnel : filtrer par `company_id`
- Exclut les utilisateurs plateforme

### `/api/platform/stats`

**GET** `/api/platform/stats`
- Statistiques globales de la plateforme
- Nombre d'entreprises clientes
- Nombre d'utilisateurs clients
- Nombre de modules activés

## Utilitaires Plateforme

### `lib/platform/supabase.ts`

**`getPlatformCompanyId()`** : Récupère l'ID de l'entreprise plateforme

**`isPlatformCompany(companyId)`** : Vérifie si une entreprise est la plateforme

**`getAllClientCompanies()`** : Liste toutes les entreprises clientes

## Migration depuis l'ancienne structure

### Anciennes routes (deprecated)

- `/api/settings/clients` → Utiliser `/api/platform/companies`
- `/api/settings/platform` → Conservée pour compatibilité frontend

### Changements dans le code

**Avant** :
```typescript
import { createAdminClient } from '@/lib/supabase/server'
const supabase = createAdminClient()
```

**Après** (pour les routes plateforme) :
```typescript
import { createPlatformClient } from '@/lib/supabase/platform'
const supabase = createPlatformClient()
```

## Règles de développement

### ✅ FAIRE

1. **Pour les APIs plateforme** :
   - Utiliser `createPlatformClient()` depuis `@/lib/supabase/platform`
   - Placer les routes dans `/api/platform/*`
   - Utiliser les utilitaires depuis `@/lib/platform/supabase`

2. **Pour les APIs client** (futur) :
   - Utiliser `createClientTampon()` depuis `@/lib/supabase/client-tampon`
   - Placer les routes dans `/api/client/*`
   - Respecter l'isolation par `company_id`

3. **Sécurité** :
   - Ne jamais utiliser `createPlatformClient()` côté client
   - Toujours vérifier que les opérations plateforme excluent la plateforme elle-même
   - Ne jamais exposer les données "clients des clients" dans les APIs plateforme

### ❌ NE PAS FAIRE

1. ❌ Utiliser `createPlatformClient()` dans les composants React
2. ❌ Mélanger les clients plateforme et client dans la même route
3. ❌ Créer des routes plateforme dans `/api/client/*` ou vice versa
4. ❌ Accéder aux données "clients des clients" depuis les APIs plateforme

## Prochaines étapes

### Backend Client (futur)

1. Créer `/api/client/*` routes pour les opérations clientes
2. Créer `lib/client/supabase.ts` avec les helpers client
3. Implémenter l'isolation stricte par `company_id`
4. Créer les APIs pour les modules métier (CRM, Facturation, etc.)

### Exemple futur API Client

```typescript
// app/api/client/dashboard/route.ts
import { createClientTampon } from '@/lib/supabase/client-tampon'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const supabase = createClientTampon()
  const user = await getCurrentUser()
  
  // Les RLS policies filtreront automatiquement par company_id
  const { data } = await supabase
    .from('invoices')
    .select('*')
    // Pas besoin de filtrer manuellement, RLS le fait
  
  return Response.json({ invoices: data })
}
```

## Tests

Pour tester les nouvelles APIs :

```bash
# Liste des entreprises clientes
curl http://localhost:3000/api/platform/companies

# Statistiques
curl http://localhost:3000/api/platform/stats

# Utilisateurs
curl http://localhost:3000/api/platform/users?company_id=xxx
```

## Notes importantes

- Les routes `/api/settings/*` sont conservées pour compatibilité avec le frontend existant
- Elles utilisent maintenant les nouveaux clients en interne
- Le frontend peut continuer à fonctionner sans modification
- Migration progressive recommandée vers les nouvelles routes

