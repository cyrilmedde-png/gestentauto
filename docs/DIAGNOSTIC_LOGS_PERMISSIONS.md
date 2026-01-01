# 🔍 DIAGNOSTIC API LOGS - Vérification Permissions

## ✅ CORRECTION APPLIQUÉE

L'API `/api/admin/logs` utilise maintenant la **même logique** que les autres pages admin :
- ✅ Import depuis `@/lib/platform/supabase`
- ✅ Utilise `getPlatformCompanyId()` depuis table `settings`
- ✅ `isPlatformCompany` async avec `await`

---

## 🧪 VÉRIFICATION SUPABASE (1 min)

### Étape 1 : Vérifier Settings (Platform Company ID)

**Exécutez dans Supabase SQL Editor** :

```sql
-- 1. Vérifier si settings.platform_company_id existe
SELECT key, value 
FROM settings 
WHERE key = 'platform_company_id';
```

**Résultat attendu** :
```
key                  | value
---------------------|---------------------------------------
platform_company_id  | "00000000-0000-0000-0000-000000000000"
```

**Si la ligne n'existe PAS** → Voir "Solution A"  
**Si la ligne existe** → Passez à Étape 2

---

### Étape 2 : Vérifier Votre User

```sql
-- 2. Votre company_id actuel
SELECT 
  id, 
  email, 
  company_id,
  created_at
FROM users 
WHERE email = 'meddecyril@icloud.com';
```

**Copiez le `company_id` affiché !**

---

### Étape 3 : Comparer

**Votre `company_id` doit être identique à `settings.platform_company_id`**

Exemple :
- Settings : `00000000-0000-0000-0000-000000000000`
- Votre user : `a1b2c3d4-e5f6-7890-abcd-ef1234567890` ❌

**Si différent** → Voir "Solution B"  
**Si identique** → Passez à "Test Final"

---

## ✅ SOLUTION A : Créer Platform Company ID dans Settings

**Si `settings.platform_company_id` n'existe pas** :

```sql
-- Créer l'entrée settings
INSERT INTO settings (key, value)
VALUES ('platform_company_id', '"00000000-0000-0000-0000-000000000000"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Vérifier
SELECT key, value FROM settings WHERE key = 'platform_company_id';
```

**OU utiliser l'UUID d'une vraie company existante** :

```sql
-- Lister les companies
SELECT id, name, created_at FROM companies ORDER BY created_at LIMIT 5;

-- Utiliser l'ID de votre company "plateforme"
INSERT INTO settings (key, value)
VALUES ('platform_company_id', to_jsonb('VOTRE-COMPANY-ID-ICI'::text))
ON CONFLICT (key) DO UPDATE SET value = to_jsonb('VOTRE-COMPANY-ID-ICI'::text);
```

---

## ✅ SOLUTION B : Mettre Votre User dans la Platform Company

**Option 1 (Recommandée)** : Utiliser l'UUID de settings

```sql
-- 1. Récupérer le platform_company_id depuis settings
SELECT value#>>'{}'::text AS platform_id 
FROM settings 
WHERE key = 'platform_company_id';

-- 2. Mettre votre user dans cette company
-- (Remplacez PLATFORM-UUID par la valeur récupérée ci-dessus)
UPDATE users 
SET company_id = 'PLATFORM-UUID'
WHERE email = 'meddecyril@icloud.com';

-- 3. Vérifier
SELECT email, company_id FROM users WHERE email = 'meddecyril@icloud.com';
```

**Option 2** : Mettre settings = votre company_id actuel

```sql
-- 1. Récupérer votre company_id
SELECT company_id FROM users WHERE email = 'meddecyril@icloud.com';

-- 2. Mettre ce company_id dans settings (remplacez VOTRE-UUID)
UPDATE settings 
SET value = to_jsonb('VOTRE-UUID'::text)
WHERE key = 'platform_company_id';

-- 3. Vérifier
SELECT value FROM settings WHERE key = 'platform_company_id';
```

---

## 🧪 TEST FINAL (Après corrections)

### Sur le VPS

```bash
# 1. SSH
ssh root@82.165.129.143

# 2. Naviguer
cd /var/www/talosprime

# 3. Pull des corrections
git pull origin main

# 4. Build
npm run build

# 5. Restart
pm2 restart talosprime

# 6. Vérifier logs
pm2 logs talosprime --lines 20
```

### Dans le Navigateur

1. ✅ **Déconnexion** : `/auth/logout` (important pour rafraîchir session)
2. ✅ **Reconnexion** : `/auth/login` avec `meddecyril@icloud.com`
3. ✅ **Accès Logs** : `/platform/logs`

**Résultat attendu** :
- ✅ Page s'affiche avec design intégré
- ✅ Stats cards (peut afficher 0 si pas de logs)
- ✅ Tableau affiche les 8 logs de Supabase

### Test API Direct

Ouvrez console (F12) :

```javascript
// Test 1: API Logs
fetch('/api/admin/logs?limit=5')
  .then(r => r.json())
  .then(d => console.log('LOGS:', d))

// Test 2: API Stats
fetch('/api/admin/logs/stats?days=7')
  .then(r => r.json())
  .then(d => console.log('STATS:', d))
```

**Résultat attendu** :
```json
{
  "success": true,
  "logs": [...],
  "total": 8
}
```

**Si toujours `success: false`** → Voir "Dépannage Avancé"

---

## 🔧 DÉPANNAGE AVANCÉ

### Erreur : "Non authentifié"

**Cause** : Session expirée ou cookies invalides

**Solution** :
```bash
# Navigateur : Effacer cookies de talosprimes.com
# Chrome: Paramètres → Confidentialité → Cookies → Supprimer données du site

# Puis reconnexion
```

---

### Erreur : "Utilisateur non trouvé"

**Cause** : User existe dans `auth.users` mais pas dans `public.users`

**Solution SQL** :
```sql
-- Vérifier auth.users
SELECT id, email FROM auth.users WHERE email = 'meddecyril@icloud.com';

-- Vérifier public.users
SELECT id, email, company_id FROM users WHERE email = 'meddecyril@icloud.com';

-- Si absent dans public.users, créer l'entrée
-- (Remplacez AUTH-USER-ID et COMPANY-ID)
INSERT INTO users (id, email, company_id, created_at, updated_at)
VALUES (
  'AUTH-USER-ID', 
  'meddecyril@icloud.com', 
  'COMPANY-ID',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

---

### Erreur : "Accès réservé aux administrateurs" (encore)

**Vérification détaillée** :

```sql
-- 1. Platform ID depuis settings
SELECT 
  'settings' AS source,
  value#>>'{}'::text AS platform_id 
FROM settings 
WHERE key = 'platform_company_id'

UNION ALL

-- 2. Votre company_id
SELECT 
  'your_user' AS source,
  company_id AS platform_id
FROM users 
WHERE email = 'meddecyril@icloud.com';
```

**Les deux doivent être identiques !**

---

### Logs PM2 montrent erreur RPC

**Si erreur** : `function platform_company_id() does not exist`

**Solution** : Créer la fonction RPC

```sql
-- Créer fonction RPC platform_company_id()
CREATE OR REPLACE FUNCTION platform_company_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT value#>>'{}'::text 
  FROM settings 
  WHERE key = 'platform_company_id'
  LIMIT 1;
$$;

-- Tester
SELECT platform_company_id();
-- Devrait retourner: 00000000-0000-0000-0000-000000000000
```

---

## 📊 CHECKLIST COMPLÈTE

### Supabase
- [ ] `settings.platform_company_id` existe
- [ ] Valeur est un UUID valide
- [ ] Votre user existe dans `public.users`
- [ ] Votre `company_id` = `platform_company_id`
- [ ] Fonction RPC `platform_company_id()` existe (optionnel mais recommandé)

### VPS
- [ ] `git pull origin main` réussi
- [ ] `npm run build` réussi
- [ ] `pm2 restart talosprime` réussi
- [ ] Pas d'erreur dans `pm2 logs`

### Application
- [ ] Déconnexion + Reconnexion effectuée
- [ ] Page `/platform/logs` accessible (pas de redirect)
- [ ] API `/api/admin/logs` retourne `success: true`
- [ ] Logs s'affichent dans le tableau

---

## 🎯 ACTIONS IMMÉDIATES

**DANS L'ORDRE** :

1. ✅ **Supabase SQL Editor** → Exécuter :
   ```sql
   SELECT key, value FROM settings WHERE key = 'platform_company_id';
   SELECT email, company_id FROM users WHERE email = 'meddecyril@icloud.com';
   ```

2. ✅ **Copier-coller les résultats ici**

3. ✅ **Selon les résultats**, appliquer Solution A ou B

4. ✅ **Déployer sur VPS** (git pull + build + restart)

5. ✅ **Déconnexion + Reconnexion**

6. ✅ **Tester `/platform/logs`**

---

**DITES-MOI LES RÉSULTATS DES 2 REQUÊTES SQL ! 🎯**

