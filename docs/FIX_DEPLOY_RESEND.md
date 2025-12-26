# 🔧 Correction : Erreur "Module not found: resend" lors du déploiement

## ❌ Problème

Lors du déploiement, le build échoue avec l'erreur :
```
Module not found: Can't resolve 'resend'
```

## 🔍 Cause

Le package `resend` a été ajouté à `package.json`, mais n'a pas été installé sur le serveur. Le script de déploiement faisait uniquement `git pull` puis `npm run build`, sans installer les nouvelles dépendances.

## ✅ Solution

Le script `scripts/deploy.sh` a été mis à jour pour inclure `npm install` avant le build.

### Option 1 : Utiliser le script de déploiement mis à jour (recommandé)

Sur le serveur, exécutez simplement :

```bash
cd /var/www/talosprime
./scripts/deploy.sh
```

Le script va maintenant :
1. Récupérer les dernières modifications depuis GitHub
2. **Installer les dépendances** (`npm install`) ← **NOUVEAU**
3. Construire l'application (`npm run build`)
4. Redémarrer PM2

### Option 2 : Installation manuelle (solution rapide)

Si vous voulez corriger immédiatement sans attendre le commit :

```bash
cd /var/www/talosprime

# Récupérer les dernières modifications
git pull origin main

# Installer les dépendances (incluant resend)
npm install

# Reconstruire l'application
npm run build

# Redémarrer l'application
pm2 restart talosprime
```

## 🔄 Vérification

Après le déploiement, vérifiez que tout fonctionne :

```bash
# Vérifier le statut PM2
pm2 status

# Voir les logs
pm2 logs talosprime --lines 50
```

L'application devrait maintenant démarrer sans erreur.

## 📝 Note

À chaque fois qu'un nouveau package est ajouté à `package.json`, le script de déploiement installera automatiquement les nouvelles dépendances grâce à cette mise à jour.



