# 🚀 Guide de déploiement en production

## Problème : Erreur 500 sur `/api/platform/leads` en production

L'erreur persiste car le code mis à jour n'est pas encore déployé sur le serveur.

## Solution : Redéployer le code mis à jour

### Sur votre machine locale (maintenant)

1. **Vérifier les modifications** :
   ```bash
   cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
   git status
   ```

2. **Ajouter et committer les modifications** :
   ```bash
   git add -A
   git commit -m "fix: Utiliser uniquement platform_leads (suppression fallback vers leads)"
   git push origin main
   ```

### Sur le serveur (après avoir poussé sur GitHub)

**Connectez-vous au serveur via SSH** et exécutez :

```bash
# 1. Aller dans le répertoire de l'application
cd /var/www/talosprime

# 2. Libérer le port 3000 (si nécessaire)
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# 3. Arrêter PM2
pm2 stop all
pm2 delete all

# 4. Récupérer le dernier code depuis GitHub
git pull origin main

# 5. Installer les dépendances (si nécessaire)
npm install

# 6. Builder l'application
npm run build

# 7. Redémarrer l'application
pm2 start npm --name "talosprime" -- start

# 8. Sauvegarder la configuration PM2
pm2 save

# 9. Vérifier les logs
pm2 logs talosprime --lines 50
```

## Vérification

Après le redéploiement :

1. **Vérifier que l'application démarre** :
   ```bash
   pm2 list
   ```
   Le statut devrait être `online` (pas `errored`).

2. **Vérifier les logs** :
   ```bash
   pm2 logs talosprime --err --lines 100
   ```
   Il ne devrait plus y avoir d'erreur PGRST205 pour `public.leads`.

3. **Tester l'application** :
   - Aller sur `https://www.talosprimes.com/platform/leads`
   - L'erreur 500 devrait disparaître
   - Les leads devraient s'afficher (ou liste vide si aucun lead)

## Si l'erreur persiste

Vérifier les logs serveur pour l'erreur exacte :
```bash
pm2 logs talosprime --err --lines 200
```

Les erreurs possibles :
- **PGRST205** : Table non trouvée → Vérifier que `platform_leads` existe dans Supabase
- **EADDRINUSE** : Port 3000 occupé → Utiliser le script `fix-port-3000.sh`
- **Autre erreur** : Vérifier les logs complets

## Script automatique de déploiement

Vous pouvez aussi utiliser le script `deploy.sh` (s'il existe) :
```bash
cd /var/www/talosprime
bash scripts/deploy.sh
```

Ou créer un script de déploiement complet :
```bash
cd /var/www/talosprime
bash scripts/fix-port-3000.sh
```







