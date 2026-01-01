# 🔐 Configuration Accès Logs : SEUL groupemclem@gmail.com

## 📋 Résumé

Ce script SQL garantit que **SEULE** l'adresse `groupemclem@gmail.com` aura accès à `/platform/logs`.

Tous les autres utilisateurs (y compris `meddecyril@icloud.com`) verront l'erreur :
```
"Accès réservé aux administrateurs"
```

---

## 🚀 INSTALLATION (2 min)

### Étape 1 : Supabase SQL Editor

1. ✅ Allez sur **Supabase Dashboard**
2. ✅ Cliquez sur **SQL Editor** (menu gauche)
3. ✅ Créez une nouvelle query
4. ✅ **Copiez-collez** le contenu de `database/setup_admin_logs_access.sql`
5. ✅ Cliquez sur **Run** (ou F5)

---

### Étape 2 : Vérifier les Résultats

Le script affichera automatiquement :

```
🔍 VÉRIFICATION FINALE

┌─────────────────────────────────────┬─────────────────────────────────────┬────────────────────┐
│ source                              │ company_id                          │ status             │
├─────────────────────────────────────┼─────────────────────────────────────┼────────────────────┤
│ settings.platform_company_id        │ a1b2c3d4-e5f6-...                   │ ✅                 │
│ ADMIN: groupemclem@gmail.com        │ a1b2c3d4-e5f6-...                   │ ✅ ACCÈS AUTORISÉ  │
│ USER: meddecyril@icloud.com         │ NULL                                │ ✅ ACCÈS REFUSÉ    │
└─────────────────────────────────────┴─────────────────────────────────────┴────────────────────┘

📊 RÉSUMÉ
┌───────────────────────────────────────────────┐
│ 1 utilisateur(s) avec accès ADMIN (attendu: 1)│
│ 0 utilisateur(s) non-admin avec platform_id   │
│ X utilisateur(s) non-admin sans accès         │
└───────────────────────────────────────────────┘
```

**✅ Si vous voyez ces résultats, la configuration est correcte !**

---

## 🔧 Ce que fait le Script

### 1. Vérification Admin
- ✅ Vérifie que `groupemclem@gmail.com` existe dans `users`
- ✅ Si absent → **ERREUR** (vous devez d'abord créer cet utilisateur)

### 2. Configuration Company
- ✅ Si `groupemclem@gmail.com` a déjà un `company_id` → L'utiliser
- ✅ Si pas de `company_id` → Créer une company "Plateforme Admin"
- ✅ Mettre ce `company_id` dans `settings.platform_company_id`

### 3. Fonction RPC
- ✅ Crée/met à jour la fonction `platform_company_id()`
- ✅ Permet à l'application de récupérer le platform_company_id efficacement

### 4. Nettoyage
- ✅ Tous les autres users qui avaient le `platform_company_id` → `company_id` mis à `NULL`
- ✅ Garantit que SEUL `groupemclem@gmail.com` a le bon `company_id`

### 5. Vérification
- ✅ Affiche un tableau de vérification
- ✅ Affiche un résumé
- ✅ Vous confirme que tout est correct

---

## 🧪 TESTER (2 min)

### Déployer sur VPS

```bash
ssh root@82.165.129.143
cd /var/www/talosprime

# Pull (les corrections API sont déjà pushées)
git pull origin main

# Build
npm run build

# Restart
pm2 restart talosprime

# Vérifier
pm2 logs talosprime --lines 20
```

---

### Test 1 : Admin Principal (doit réussir)

1. ✅ Ouvrir : `https://www.talosprimes.com/auth/logout`
2. ✅ Connexion avec : **`groupemclem@gmail.com`**
3. ✅ Accéder à : `https://www.talosprimes.com/platform/logs`

**Résultat attendu** :
- ✅ Page s'affiche
- ✅ Design dark glassmorphism
- ✅ Stats cards
- ✅ Tableau avec logs (ou vide si pas de logs)

---

### Test 2 : User Test (doit échouer)

1. ✅ Ouvrir : `https://www.talosprimes.com/auth/logout`
2. ✅ Connexion avec : **`meddecyril@icloud.com`**
3. ✅ Accéder à : `https://www.talosprimes.com/platform/logs`

**Résultat attendu** :
- ❌ Rien ne s'affiche (page blanche ou loading infini)
- ❌ Console (F12) affiche : `{success: false, error: "Accès réservé aux administrateurs"}`

**C'est normal !** ✅ Seul `groupemclem@gmail.com` a accès.

---

### Test API Direct (Console F12)

```javascript
// Test avec groupemclem@gmail.com connecté
fetch('/api/admin/logs?limit=5')
  .then(r => r.json())
  .then(d => console.log('ADMIN:', d))
// Résultat attendu: {success: true, logs: [...]}

// Test avec meddecyril@icloud.com connecté
fetch('/api/admin/logs?limit=5')
  .then(r => r.json())
  .then(d => console.log('TEST USER:', d))
// Résultat attendu: {success: false, error: "Accès réservé aux administrateurs"}
```

---

## 🔍 Dépannage

### Erreur : "L'utilisateur groupemclem@gmail.com n'existe pas"

**Cause** : L'utilisateur n'existe pas dans la table `users`

**Solution** :
```sql
-- Vérifier auth.users
SELECT id, email FROM auth.users WHERE email = 'groupemclem@gmail.com';

-- Si existe dans auth.users mais pas dans users, créer l'entrée
INSERT INTO users (id, email, created_at, updated_at)
SELECT id, email, created_at, NOW()
FROM auth.users
WHERE email = 'groupemclem@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Puis relancer le script setup_admin_logs_access.sql
```

---

### groupemclem@gmail.com voit toujours "Accès refusé"

**Vérification** :
```sql
-- Comparer les company_id
SELECT 
  'settings' AS source,
  value#>>'{}'::text AS company_id
FROM settings 
WHERE key = 'platform_company_id'

UNION ALL

SELECT 
  'groupemclem' AS source,
  company_id::text
FROM users 
WHERE email = 'groupemclem@gmail.com';
```

**Les deux DOIVENT être identiques !**

**Si différent** : Relancer le script `setup_admin_logs_access.sql`

---

### meddecyril@icloud.com a toujours accès (ne devrait pas)

**Vérification** :
```sql
SELECT email, company_id
FROM users
WHERE email = 'meddecyril@icloud.com';
```

**Si `company_id` = platform_company_id** :
```sql
UPDATE users
SET company_id = NULL
WHERE email = 'meddecyril@icloud.com';
```

---

## 📊 Vérifications Manuelles

### Vérifier settings
```sql
SELECT key, value, created_at 
FROM settings 
WHERE key = 'platform_company_id';
```

### Vérifier fonction RPC
```sql
SELECT platform_company_id();
-- Devrait retourner un UUID
```

### Lister tous les admins
```sql
SELECT u.email, u.company_id
FROM users u
WHERE u.company_id = (
  SELECT (value#>>'{}'::text)::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
);
-- Devrait retourner UNIQUEMENT groupemclem@gmail.com
```

### Lister les non-admins
```sql
SELECT email, company_id
FROM users
WHERE company_id != (
  SELECT (value#>>'{}'::text)::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
)
OR company_id IS NULL
ORDER BY email;
-- Devrait retourner tous les autres users
```

---

## 🎯 Checklist Complète

### Configuration Supabase
- [ ] Script `setup_admin_logs_access.sql` exécuté sans erreur
- [ ] `settings.platform_company_id` existe
- [ ] `groupemclem@gmail.com` a le bon `company_id`
- [ ] Autres users n'ont PAS le `platform_company_id`
- [ ] Fonction RPC `platform_company_id()` créée

### Déploiement VPS
- [ ] `git pull origin main` réussi
- [ ] `npm run build` réussi (sans erreurs)
- [ ] `pm2 restart talosprime` réussi
- [ ] Pas d'erreurs dans `pm2 logs`

### Tests Fonctionnels
- [ ] Test admin : `groupemclem@gmail.com` → ✅ Logs s'affichent
- [ ] Test user : `meddecyril@icloud.com` → ❌ Accès refusé
- [ ] API admin retourne `success: true`
- [ ] API user test retourne `success: false`

---

## ✅ RÉSULTAT FINAL

Après exécution du script :

| Utilisateur | Email | Accès /platform/logs | Status |
|-------------|-------|---------------------|---------|
| **Admin Principal** | `groupemclem@gmail.com` | ✅ OUI | Peut voir tous les logs |
| **Test User** | `meddecyril@icloud.com` | ❌ NON | "Accès réservé aux administrateurs" |
| **Autres Users** | `*@*.com` | ❌ NON | "Accès réservé aux administrateurs" |

---

## 🚀 Commande Rapide

Pour tout faire en une fois (après exécution du script SQL) :

```bash
# Sur VPS
ssh root@82.165.129.143 "cd /var/www/talosprime && git pull origin main && npm run build && pm2 restart talosprime && pm2 logs talosprime --lines 20"
```

---

## 📞 Support

Si après toutes ces étapes ça ne fonctionne toujours pas :

1. ✅ Copiez le résultat du script SQL (tableau de vérification)
2. ✅ Copiez les logs PM2 (`pm2 logs talosprime --err --lines 50`)
3. ✅ Copiez le résultat de la console navigateur (F12) avec l'erreur API
4. ✅ Partagez-les pour diagnostic

---

**Script prêt à être exécuté ! 🚀**

