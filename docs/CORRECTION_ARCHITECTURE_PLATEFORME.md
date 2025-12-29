# 🔧 Correction Architecture Plateforme/Client - Guide Complet

## 📋 Problème identifié

Quand vous vous connectez avec les identifiants plateforme :
- ✅ Vous voyez les entreprises clients
- ✅ Vous voyez les utilisateurs
- ❌ Vous NE voyez PAS les leads (erreur ou données vides)

## 🎯 Solution mise en place

### 1. Correction des RLS Policies

**Fichier** : `database/fix_rls_leads_platform.sql`

Ce script corrige les RLS policies pour que :
- Seuls les utilisateurs plateforme peuvent accéder aux leads
- Les clients ne peuvent pas voir les leads (même avec RLS activé)

**À exécuter dans Supabase SQL Editor** :
```sql
-- Voir le fichier database/fix_rls_leads_platform.sql
```

### 2. Middleware de vérification plateforme

**Fichier** : `lib/middleware/platform-auth.ts`

Nouveau middleware qui :
- Vérifie que l'utilisateur est plateforme avant d'accéder aux routes `/api/platform/*`
- Utilise le client admin pour bypasser RLS et vérifier le `company_id`
- Retourne une erreur 403 si l'utilisateur n'est pas plateforme

### 3. Protection des routes API

Toutes les routes `/api/platform/*` doivent maintenant :
1. Appeler `verifyPlatformUser(request)` au début
2. Vérifier que `isPlatform === true`
3. Retourner 403 si l'utilisateur n'est pas plateforme

**Exemple** :
```typescript
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

export async function GET(request: NextRequest) {
  // Vérifier que l'utilisateur est plateforme
  const { isPlatform, error: authError } = await verifyPlatformUser(request)
  
  if (!isPlatform) {
    return createForbiddenResponse(authError || 'Access denied. Platform user required.')
  }
  
  // ... reste du code
}
```

### 4. Correction du frontend

**Fichier** : `components/auth/ProtectedPlatformRoute.tsx`

Correction pour envoyer l'ID utilisateur dans le body ET le header :
```typescript
fetch('/api/auth/check-user-type', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id,
  },
  body: JSON.stringify({ userId: user.id }),
})
```

## 📝 Étapes de déploiement

### Étape 1 : Exécuter le script SQL

1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Copier le contenu de `database/fix_rls_leads_platform.sql`
4. Exécuter le script
5. Vérifier qu'il n'y a pas d'erreurs

### Étape 2 : Vérifier la configuration

Exécuter ces requêtes SQL pour vérifier :

```sql
-- 1. Vérifier que is_platform_user() fonctionne
SELECT 
  u.id,
  u.email,
  u.company_id,
  public.is_platform_user() as is_platform
FROM users u
WHERE u.email = 'votre-email@example.com';

-- 2. Vérifier le platform_company_id
SELECT 
  key,
  value,
  value#>>'{}' as extracted_value
FROM settings
WHERE key = 'platform_company_id';

-- 3. Vérifier les RLS policies sur leads
SELECT * FROM pg_policies WHERE tablename = 'leads';
```

### Étape 3 : Tester l'accès

1. Se connecter avec un compte plateforme
2. Aller sur `/platform/leads`
3. Vérifier que les leads s'affichent
4. Vérifier la console du navigateur (pas d'erreur 403)

### Étape 4 : Tester l'isolation

1. Se connecter avec un compte client
2. Essayer d'accéder à `/platform/leads`
3. Vérifier qu'il est redirigé vers `/dashboard`
4. Vérifier qu'il ne peut pas accéder aux leads

## 🔍 Routes API à protéger

Les routes suivantes ont été protégées :
- ✅ `GET /api/platform/leads`
- ✅ `POST /api/platform/leads`

Les routes suivantes doivent être protégées (à faire) :
- ⏳ `GET /api/platform/leads/[id]`
- ⏳ `PATCH /api/platform/leads/[id]`
- ⏳ `DELETE /api/platform/leads/[id]`
- ⏳ `POST /api/platform/leads/[id]/questionnaire`
- ⏳ `POST /api/platform/leads/[id]/interview`
- ⏳ `POST /api/platform/leads/[id]/trial`
- ⏳ Toutes les autres routes `/api/platform/*`

## 🚨 Points critiques

1. **Service Role Key** : Les routes API utilisent `createPlatformClient()` qui utilise le service role key. Cela bypass les RLS, donc on doit vérifier manuellement que l'utilisateur est plateforme.

2. **RLS Policies** : Même si le service role bypass les RLS, on doit quand même avoir des policies correctes pour :
   - Empêcher les clients d'accéder directement à Supabase (si jamais ils le font)
   - Documenter les règles d'accès

3. **Frontend** : Le frontend ne doit JAMAIS faire d'appels directs à Supabase pour les leads. Toujours passer par les routes API.

## ✅ Checklist de vérification

- [ ] Script SQL exécuté dans Supabase
- [ ] `is_platform_user()` fonctionne correctement
- [ ] `platform_company_id` est correctement défini
- [ ] Routes API protégées avec `verifyPlatformUser()`
- [ ] Frontend envoie `userId` dans header et body
- [ ] Test d'accès plateforme : ✅ Les leads s'affichent
- [ ] Test d'isolation client : ✅ Les clients ne voient pas les leads
- [ ] Console navigateur : ✅ Pas d'erreur 403

## 📚 Documentation complémentaire

- `docs/ARCHITECTURE_PLATEFORME_CLIENT.md` : Architecture complète
- `database/fix_rls_leads_platform.sql` : Script SQL de correction
- `lib/middleware/platform-auth.ts` : Middleware de vérification







