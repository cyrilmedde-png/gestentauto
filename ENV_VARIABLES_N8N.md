# 🔧 VARIABLES D'ENVIRONNEMENT - N8N

---

## 📋 VARIABLE À AJOUTER

Pour que les workflows N8N fonctionnent, vous devez ajouter cette variable d'environnement :

```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

---

## 🖥️ EN LOCAL (.env.local)

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
# N8N
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

**Puis redémarrez votre serveur de développement** :
```bash
npm run dev
```

---

## 🚀 SUR LE VPS (Production)

### Méthode 1 : Via fichier .env

```bash
ssh root@votre-vps
cd /var/www/talosprime

# Éditer le fichier .env
nano .env

# Ajouter la ligne:
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com

# Sauvegarder (Ctrl+O, Enter, Ctrl+X)

# Rebuild et restart
npm run build
pm2 restart talosprime
```

### Méthode 2 : Via PM2 (Plus propre)

```bash
ssh root@votre-vps
cd /var/www/talosprime

# Set via PM2
pm2 set talosprime:NEXT_PUBLIC_N8N_WEBHOOK_URL https://n8n.talosprimes.com

# Ou via ecosystem.config.js
pm2 stop talosprime
pm2 delete talosprime
pm2 start npm --name talosprime -- start --env-add "NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com"
pm2 save
```

---

## ✅ VÉRIFIER QUE LA VARIABLE EST CHARGÉE

### En Local

```bash
# Dans votre terminal
node -e "console.log(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL)"
# Devrait afficher: https://n8n.talosprimes.com
```

### Sur le VPS

```bash
ssh root@votre-vps
pm2 env talosprime | grep N8N
# Devrait afficher: NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

---

## 🧪 TESTER L'INTÉGRATION

### Test 1 : Modifier un Plan

```bash
# 1. Aller sur: https://www.talosprimes.com/platform/plans
# 2. Cliquer ✏️ sur "Starter"
# 3. Changer "Max Utilisateurs" : 1 → 10
# 4. Cliquer ✅ (Sauvegarder)
```

**Vérifier dans les logs** :
```bash
# Local
# Regarder le terminal où tourne "npm run dev"
# Devrait afficher: "🔔 Déclenchement workflow N8N: plan-modified"
# Et: "✅ Workflow N8N déclenché avec succès"

# VPS
pm2 logs talosprime --lines 50
# Chercher: "🔔 Déclenchement workflow N8N"
```

### Test 2 : Activer/Désactiver un Plan

```bash
# 1. Aller sur: /platform/plans
# 2. Cliquer 👁️ sur "Business"
# 3. Observer le changement de statut
```

**Vérifier dans N8N** :
```bash
# 1. Aller sur: https://n8n.talosprimes.com
# 2. Ouvrir le workflow "Gestion Plans - Notifications"
# 3. Onglet "Executions"
# 4. Vérifier qu'il y a de nouvelles exécutions
```

---

## 🔍 DÉPANNAGE

### Erreur: "Workflow N8N échoué (non bloquant)"

**Causes possibles** :
1. N8N n'est pas démarré
2. Le workflow n'est pas importé
3. Le workflow n'est pas activé
4. L'URL du webhook est incorrecte

**Solutions** :
```bash
# 1. Vérifier que N8N tourne
curl https://n8n.talosprimes.com/healthz
# Devrait retourner: OK

# 2. Vérifier que le workflow existe
# Aller sur: https://n8n.talosprimes.com
# Workflows → Chercher "Gestion Plans"

# 3. Activer le workflow
# Toggle en haut à droite (OFF → ON)

# 4. Tester le webhook directement
curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "plan_updated",
    "planId": "test",
    "planName": "Test",
    "modifiedBy": "test@example.com"
  }'
# Devrait retourner: {"success": true}
```

### Erreur: "process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL is undefined"

**Solution** :
```bash
# 1. Vérifier que la variable est dans .env.local
cat .env.local | grep N8N

# 2. Redémarrer le serveur de dev
# Ctrl+C puis npm run dev

# 3. Si toujours pas, hard clean:
rm -rf .next
npm run dev
```

---

## 📊 RÉCAPITULATIF

### Variable Nécessaire
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.talosprimes.com
```

### Où l'Ajouter
- ✅ Local : `.env.local`
- ✅ VPS : `.env` ou PM2

### Workflows Connectés Après Étape 1
- ✅ Modification plan → `plan-modified`
- ✅ Toggle plan → `plan-modified`

### Prochaines Étapes
- ⏳ Webhooks Stripe (Étape 2)
- ⏳ Actions client (Étape 3)
- ⏳ Crons automatiques (Étape 4)

---

**🎯 Après avoir ajouté la variable, passez à l'étape de test !**

