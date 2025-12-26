# 🔧 Résolution des erreurs - Guide complet

## Problèmes identifiés

1. **EADDRINUSE : Port 3000 déjà utilisé** - L'application ne peut pas démarrer
2. **PGRST205 : Table 'public.leads' not found** - Le code cherche encore l'ancienne table

## Solutions appliquées

### 1. Code simplifié pour utiliser uniquement `platform_leads`

Le code a été mis à jour pour utiliser **uniquement** `platform_leads` (sans fallback vers `leads`).

### 2. Script pour libérer le port 3000

Le script `scripts/fix-port-3000.sh` permet de libérer le port et redémarrer l'application.

## Actions à exécuter sur le serveur

### Option 1 : Utiliser le script automatique

```bash
cd /var/www/talosprime
git pull origin main
bash scripts/fix-port-3000.sh
```

### Option 2 : Commandes manuelles

```bash
# 1. Aller dans le répertoire
cd /var/www/talosprime

# 2. Libérer le port 3000
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# 3. Arrêter PM2
pm2 stop all
pm2 delete all

# 4. Récupérer le code
git pull origin main

# 5. Builder
npm install
npm run build

# 6. Redémarrer
pm2 start npm --name "talosprime" -- start
pm2 save

# 7. Vérifier
pm2 logs talosprime --lines 50
```

## Vérifications après redéploiement

### 1. Vérifier que l'application démarre

```bash
pm2 list
```

Le statut devrait être `online` (pas `errored`).

### 2. Vérifier les logs

```bash
pm2 logs talosprime --lines 100
```

Vous devriez voir :
- ✅ Plus d'erreur EADDRINUSE
- ✅ L'application démarre correctement
- ⚠️ Si erreur PGRST205, vérifier que c'est bien pour `platform_leads` (pas `leads`)

### 3. Tester l'application

- Aller sur `https://www.talosprimes.com/platform/leads`
- L'erreur 500 devrait disparaître
- Les leads devraient s'afficher (ou liste vide si aucun lead)

## Si l'erreur PGRST205 persiste

Si vous voyez encore `Could not find the table 'public.leads'`, cela signifie que :

1. **Le code n'a pas été redéployé** - Vérifier que `git pull` a bien récupéré les modifications
2. **Problème de cache Supabase** - Essayer de rafraîchir le schéma dans Supabase Dashboard
3. **Autre route utilise encore `leads`** - Vérifier les autres fichiers API

## Commandes de diagnostic

```bash
# Vérifier que le code utilise platform_leads
cd /var/www/talosprime
grep -r "\.from('leads')" app/api/platform/leads/ || echo "✅ Aucune référence à 'leads' trouvée"

# Vérifier les processus sur le port 3000
sudo lsof -i :3000

# Vérifier les logs PM2
pm2 logs talosprime --err --lines 100
```

## Résultat attendu

Après ces actions :
- ✅ L'application démarre sans erreur EADDRINUSE
- ✅ Le code utilise uniquement `platform_leads`
- ✅ L'erreur 500 sur `/api/platform/leads` disparaît
- ✅ Les leads s'affichent correctement (ou liste vide)




