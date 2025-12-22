# 🚀 Actions immédiates pour résoudre les erreurs

## Problèmes identifiés

1. **Port 3000 déjà utilisé** (EADDRINUSE) - L'application ne peut pas démarrer
2. **Table leads non trouvée** (PGRST205) - Mais `platform_leads` existe ✅

## Solution rapide

### Sur le serveur, exécuter ces commandes :

```bash
# 1. Aller dans le répertoire de l'application
cd /var/www/talosprime

# 2. Libérer le port 3000 (tuer les processus qui l'utilisent)
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# 3. Arrêter toutes les instances PM2
pm2 stop all
pm2 delete all

# 4. Récupérer le dernier code
git pull origin main

# 5. Installer les dépendances si nécessaire
npm install

# 6. Builder l'application
npm run build

# 7. Redémarrer avec PM2
pm2 start npm --name "talosprime" -- start

# 8. Sauvegarder la configuration PM2
pm2 save

# 9. Vérifier les logs
pm2 logs talosprime --lines 50
```

## Ou utiliser le script automatique

```bash
cd /var/www/talosprime
git pull origin main
bash scripts/fix-port-3000.sh
```

## Vérification

Après ces commandes, vérifier :

1. **Que l'application démarre** :
   ```bash
   pm2 list
   ```
   Devrait afficher `talosprime` avec le statut `online`

2. **Qu'il n'y a plus d'erreur EADDRINUSE** :
   ```bash
   pm2 logs talosprime --lines 20
   ```

3. **Tester l'application** :
   - Aller sur `https://www.talosprimes.com/platform/leads`
   - L'erreur 500 devrait disparaître

## Si ça ne fonctionne toujours pas

Vérifier les logs pour voir l'erreur exacte :
```bash
pm2 logs talosprime --err --lines 100
```

Les erreurs devraient maintenant être différentes car le code utilise uniquement `platform_leads`.

