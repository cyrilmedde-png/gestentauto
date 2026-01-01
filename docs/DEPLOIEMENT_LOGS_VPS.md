# 🚀 DÉPLOIEMENT VPS - Page Logs Design Intégré

## ⚡ DÉPLOIEMENT RAPIDE (2 min)

```bash
# 1. Connexion SSH
ssh root@82.165.129.143

# 2. Naviguer vers le projet
cd /var/www/talosprime

# 3. Pull des dernières modifications
git pull origin main

# 4. Build (devrait réussir maintenant!)
npm run build

# 5. Redémarrer l'application
pm2 restart talosprime

# 6. Vérifier les logs
pm2 logs talosprime --lines 20
```

---

## ✅ Vérifications Post-Déploiement

### 1. Build Réussi ?
```bash
✓ Compiled successfully in X.Xs
✓ Next.js 16.1.0
```

**Si erreur** → Voir section "Dépannage"

---

### 2. Page Accessible ?
Ouvrez dans le navigateur :
```
https://www.talosprimes.com/platform/logs
```

**Attendu** :
- ✅ Design dark avec glassmorphism
- ✅ Stats cards affichées (ou 0 si pas de logs)
- ✅ Tabs fonctionnels
- ✅ Tableau vide ou avec logs

---

### 3. API Fonctionne ?
Ouvrez la console navigateur (F12) :
```javascript
fetch('/api/admin/logs?limit=10')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Résultat attendu** :
```json
{
  "success": true,
  "logs": [...],
  "total": 8,
  "hasMore": false
}
```

**Si `logs: []`** → Voir section "Générer Logs de Test"

---

### 4. Stats API Fonctionne ?
```javascript
fetch('/api/admin/logs/stats?days=7')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Résultat attendu** :
```json
{
  "success": true,
  "totalLogs": 8,
  "byStatus": {
    "success": 5,
    "error": 2,
    "warning": 1,
    "info": 0
  },
  "successRate": 62.5,
  "errorRate": 25.0
}
```

---

## 🧪 Générer Logs de Test (Si table vide)

### Méthode 1 : Via Supabase SQL Editor

```sql
INSERT INTO subscription_logs (event_type, status, subscription_id, details, source)
VALUES 
  ('subscription_created', 'success', 'sub_test_001', '{"plan": "Business", "amount": 99}'::jsonb, 'test_sql'),
  ('payment_failed', 'error', 'sub_test_002', '{"card_last4": "4242"}'::jsonb, 'test_sql'),
  ('plan_upgraded', 'success', 'sub_test_003', '{"old_plan": "Starter", "new_plan": "Business"}'::jsonb, 'test_sql'),
  ('payment_succeeded', 'success', 'sub_test_004', '{"amount": 99}'::jsonb, 'test_sql'),
  ('subscription_canceled', 'info', 'sub_test_005', '{"reason": "Client request"}'::jsonb, 'test_sql');
```

**Puis** :
```sql
SELECT COUNT(*) FROM subscription_logs;
-- Devrait retourner: 5
```

---

### Méthode 2 : Via N8N Webhook (Recommandé)

```bash
# Test 1: Success
curl -X POST https://n8n.talosprimes.com/webhook/log-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription_created",
    "status": "success",
    "subscription_id": "sub_test_001",
    "details": {"plan": "Business", "amount": 99},
    "source": "test_curl"
  }'

# Test 2: Error
curl -X POST https://n8n.talosprimes.com/webhook/log-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "payment_failed",
    "status": "error",
    "subscription_id": "sub_test_002",
    "error_message": "Carte bancaire expirée",
    "details": {"card_last4": "4242", "attempt": 1},
    "source": "test_curl"
  }'
```

**Résultat attendu** :
```json
{"success": true, "message": "Log enregistré", "log_id": "..."}
```

---

## 🔍 Dépannage

### Erreur: "Module not found: @/lib/services/auth-helpers"

**Solution** :
```bash
# Vérifier que le fichier existe
ls -la lib/services/auth-helpers.ts

# Si absent, pull à nouveau
git pull origin main
npm run build
```

---

### Erreur: "Build failed"

**Solution 1** : Nettoyer cache
```bash
rm -rf .next
npm run build
```

**Solution 2** : Réinstaller dépendances
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Page affiche "Aucun log trouvé"

**Vérification 1** : Table existe ?
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'subscription_logs';
```

**Vérification 2** : Logs existent ?
```sql
SELECT COUNT(*) FROM subscription_logs;
```

**Si 0** → Générer logs de test (voir section ci-dessus)

---

### Erreur 403 sur API

**Cause** : Vous n'êtes pas admin plateforme

**Solution** :
```sql
-- Vérifier votre company_id
SELECT id, email, company_id 
FROM users 
WHERE email = 'votre-email@example.com';

-- Devrait être: 00000000-0000-0000-0000-000000000000
```

**Si différent** :
```sql
UPDATE users 
SET company_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'votre-email@example.com';
```

---

## 📊 Vérification Visuelle

### Checklist Design

Après déploiement, vérifiez visuellement :

- ✅ **Header** : Icon gradient purple/pink + titre "Logs Système"
- ✅ **Stats Cards** : 4 cards avec gradients (blue, green, red, yellow)
- ✅ **Tabs** : Gradient purple/pink sur tab actif
- ✅ **Filtres** : Select + search bar glassmorphism
- ✅ **Tableau** : 
  - Headers en `gray-400` uppercase
  - Rows alternées (`bg-black/20` / transparent)
  - Hover effect (`hover:bg-white/5`)
  - Status badges colorés semi-transparents
- ✅ **Détails expandables** : 
  - JSON formaté dans `bg-black/60`
  - Metadata cards `bg-white/5`
  - Error message en red si présent
- ✅ **Pagination** : Buttons glassmorphism disabled state correct
- ✅ **Empty state** : Icon + message si aucun log
- ✅ **Loading state** : Spinner purple animé

---

## 🎯 Tests Fonctionnels

### Test 1 : Filtres
1. Sélectionner "✅ Succès" dans le dropdown
2. → Tableau affiche uniquement logs success
3. Sélectionner "❌ Erreur"
4. → Tableau affiche uniquement logs error

---

### Test 2 : Tabs
1. Cliquer sur "✨ Créations"
2. → Gradient purple/pink appliqué
3. → Tableau filtré sur `subscription_created`

---

### Test 3 : Recherche
1. Taper "sub_test" dans la barre de recherche
2. → Tableau filtré sur logs contenant "sub_test"

---

### Test 4 : Pagination
1. Si > 50 logs, bouton "Suivant →" actif
2. Cliquer sur "Suivant"
3. → Page 2 affichée
4. Bouton "← Précédent" maintenant actif

---

### Test 5 : Détails Expandables
1. Cliquer sur "▶ Détails" d'un log
2. → Row expansion avec JSON, metadata, error (si présent)
3. Cliquer sur "▼ Masquer"
4. → Row repliée

---

## 🚀 Commandes Utiles VPS

```bash
# Status PM2
pm2 status

# Logs en temps réel
pm2 logs talosprime --lines 50

# Restart app
pm2 restart talosprime

# Reload (sans downtime)
pm2 reload talosprime

# Monitoring
pm2 monit

# Liste des processus
pm2 list

# Infos détaillées
pm2 show talosprime
```

---

## 📝 Notes Importantes

1. **Cache Browser** : Si changements pas visibles, CTRL+SHIFT+R (hard refresh)

2. **PM2 Logs** : Si erreur au runtime, toujours vérifier :
   ```bash
   pm2 logs talosprime --err --lines 100
   ```

3. **Build Time** : Le build peut prendre 30-60 secondes avec Next.js 16

4. **Hot Reload** : PM2 ne fait PAS de hot reload, toujours faire `pm2 restart`

---

## ✅ Checklist Finale

- [ ] Git pull réussi
- [ ] Build réussi sans erreurs
- [ ] PM2 restart réussi
- [ ] Page `/platform/logs` accessible
- [ ] Design matches screenshots
- [ ] Stats API retourne données
- [ ] Logs API retourne données (ou table vide confirmée)
- [ ] Filtres fonctionnent
- [ ] Tabs fonctionnent
- [ ] Recherche fonctionne
- [ ] Détails expandables fonctionnent
- [ ] Pagination fonctionne (si > 50 logs)

---

## 🎉 C'est Déployé !

Si toutes les vérifications passent, la page Logs est maintenant :
- ✅ Déployée en production
- ✅ Design intégré avec l'application
- ✅ Protégée (admin only)
- ✅ Fonctionnelle à 100%

**Prochaines étapes suggérées** :
1. Activer logging dans tous les workflows N8N
2. Monitorer les logs en temps réel
3. Configurer alertes pour erreurs critiques
4. Exporter logs pour analytics (optionnel)

