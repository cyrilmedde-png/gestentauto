# 🚀 Guide Déploiement - Permissions Admins

## ⚡ Installation Rapide (5 min)

### Étape 1 : Migration SQL

```sql
-- 1. Ouvrir Supabase SQL Editor
-- 2. Copier-coller ce code:

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "logs": true,
  "plans": true,
  "subscriptions": true,
  "admins": true,
  "analytics": true,
  "clients": true,
  "users": true,
  "modules": true
}'::jsonb;

UPDATE users
SET permissions = '{
  "logs": true,
  "plans": true,
  "subscriptions": true,
  "admins": true,
  "analytics": true,
  "clients": true,
  "users": true,
  "modules": true
}'::jsonb
WHERE permissions IS NULL 
AND company_id IN (
  SELECT value::text::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
);

CREATE INDEX IF NOT EXISTS idx_users_permissions 
ON users USING gin (permissions);
```

### Étape 2 : Déploiement VPS

```bash
# SSH sur VPS
ssh root@62.171.152.132

# Pull + Build + Restart
cd /var/www/talosprime
git pull origin main
npm run build
pm2 restart talosprime

# Vérifier
pm2 logs talosprime --lines 50
```

---

## 🧪 Test Complet

### 1. **Accéder à la Page**
```
https://www.talosprimes.com/platform/admins
```

### 2. **Cliquer "Modifier" sur un Admin**
- Modal s'ouvre avec profil + permissions

### 3. **Modifier le Profil**
```
Prénom: Test
Nom: Modifier
Email: (laisser tel quel)
```

### 4. **Désactiver 2-3 Permissions**
- Cliquer sur les toggles (ex: Abonnements, Modules)
- Toggles deviennent gris

### 5. **Enregistrer**
- Cliquer "Enregistrer"
- Message de succès apparaît
- Modal se ferme
- Liste admins se rafraîchit

### 6. **Vérifier Email**
- Ouvrir boîte mail de l'admin modifié
- Email reçu avec liste permissions
- ✅ = activé, ❌ = désactivé

### 7. **Vérifier DB**
```sql
SELECT 
  email,
  first_name,
  last_name,
  permissions
FROM users
WHERE company_id IN (
  SELECT value::text::uuid 
  FROM settings 
  WHERE key = 'platform_company_id'
);
```

---

## 🔍 Logs Debug

### Si Erreur "Non authentifié"
```bash
pm2 logs talosprime | grep "update-admin"
# Vérifier si cookie session valide
```

### Si Erreur "Accès réservé aux administrateurs"
```bash
# Vérifier company_id dans Supabase
SELECT 
  id, 
  email, 
  company_id 
FROM users 
WHERE email = 'groupemclem@gmail.com';

# Comparer avec platform_company_id
SELECT value FROM settings WHERE key = 'platform_company_id';
```

### Si Email non envoyé
```bash
# Vérifier Resend dans .env.production
cat /var/www/talosprime/.env.production | grep RESEND

# Vérifier logs
pm2 logs talosprime | grep "email"
```

---

## ✅ Checklist Validation

- [ ] SQL migration exécutée sans erreur
- [ ] `git pull` OK sur VPS
- [ ] `npm run build` OK (pas d'erreur TypeScript)
- [ ] `pm2 restart` OK
- [ ] Page `/platform/admins` s'affiche
- [ ] Bouton "Modifier" ouvre le modal
- [ ] Modal affiche profil + permissions
- [ ] Toggle permissions fonctionne (visuel change)
- [ ] Bouton "Enregistrer" fonctionne
- [ ] Message succès s'affiche
- [ ] Modal se ferme
- [ ] Email notification reçu
- [ ] Permissions enregistrées dans DB
- [ ] Aucune erreur dans `pm2 logs`

---

## 🎉 Succès !

Si tous les tests passent :
✅ **Modal fonctionnel**
✅ **Permissions enregistrées**
✅ **Email envoyé**
✅ **DB à jour**

**PRÊT POUR PRODUCTION ! 🚀**

---

## ⚠️ Problèmes Connus

### 1. **Toggle ne change pas visuellement**
→ Clear cache navigateur (Cmd+Shift+R)

### 2. **Email non reçu**
→ Vérifier spam
→ Vérifier domaine Resend vérifié

### 3. **Erreur 403 "Accès réservé"**
→ Vérifier que vous êtes bien connecté avec l'admin principal
→ Vérifier `company_id` dans DB

---

## 📞 Support

Si problème persistant :
1. Copier logs PM2 : `pm2 logs talosprime --lines 100 > logs.txt`
2. Copier console navigateur (F12)
3. Envoyer les 2 fichiers

**TOUT DEVRAIT FONCTIONNER DU PREMIER COUP ! 💪**

