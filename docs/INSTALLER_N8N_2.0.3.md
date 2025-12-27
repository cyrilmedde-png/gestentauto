# Installation de N8N version 2.0.3

## Pourquoi la version 2.0.3 ?

La version 2.0.3 de N8N est considérée comme plus stable que les versions récentes (2.1.x). Elle est recommandée pour les environnements de production.

## Installation

### Sur le serveur

1. **Connectez-vous au serveur** et allez dans le répertoire du projet :
```bash
cd /var/www/talosprime
# Ou le répertoire où se trouve votre projet
```

2. **Récupérez le script** :
```bash
git pull origin main
```

3. **Exécutez le script d'installation** :
```bash
sudo bash scripts/install-n8n-2.0.3.sh
```

### Ce que fait le script

- ✅ Vérifie les prérequis (Node.js, npm, PM2)
- ✅ Sauvegarde la configuration actuelle (.env et ecosystem.config.js)
- ✅ Arrête N8N s'il est en cours d'exécution
- ✅ Installe N8N version 2.0.3 globalement (`npm install -g n8n@2.0.3`)
- ✅ Installe N8N version 2.0.3 localement dans `/var/n8n`
- ✅ Met à jour ecosystem.config.js pour utiliser la version locale
- ✅ Redémarre N8N avec PM2
- ✅ Vérifie que l'installation fonctionne

## Vérification

### Vérifier la version CLI
```bash
n8n --version
# Devrait afficher: 2.0.3
```

### Vérifier la version dans le panel N8N
1. Accédez à `https://www.talosprimes.com/platform/n8n`
2. Allez dans **Settings** (⚙️)
3. En bas de la page, vous devriez voir **Version 2.0.3**

### Vérifier le statut PM2
```bash
sudo -u n8n pm2 status
sudo -u n8n pm2 logs n8n
```

## Commandes utiles

```bash
# Voir le statut
sudo -u n8n pm2 status

# Voir les logs
sudo -u n8n pm2 logs n8n

# Redémarrer N8N
sudo -u n8n pm2 restart n8n

# Arrêter N8N
sudo -u n8n pm2 stop n8n

# Démarrer N8N
sudo -u n8n pm2 start n8n
```

## Résolution de problèmes

### Si N8N ne démarre pas

1. **Vérifier les logs** :
```bash
sudo -u n8n pm2 logs n8n --lines 50
```

2. **Vérifier les variables d'environnement** :
```bash
sudo cat /var/n8n/.env
```

3. **Vérifier les permissions** :
```bash
sudo ls -la /var/n8n
sudo chown -R n8n:n8n /var/n8n
```

### Si la version ne correspond pas

Si le CLI affiche 2.0.3 mais le panel affiche une autre version :

1. **Vérifier que ecosystem.config.js utilise la version locale** :
```bash
sudo cat /var/n8n/ecosystem.config.js | grep script
# Devrait afficher: script: '/var/n8n/node_modules/.bin/n8n'
```

2. **Réinstaller localement** :
```bash
cd /var/n8n
sudo -u n8n npm install n8n@2.0.3 --save --save-exact
sudo -u n8n pm2 restart n8n
```

### Restaurer la sauvegarde

Si quelque chose ne va pas, vous pouvez restaurer les sauvegardes :

```bash
# Trouver les sauvegardes
ls -la /var/n8n/.env.backup.*
ls -la /var/n8n/ecosystem.config.js.backup.*

# Restaurer (remplacer TIMESTAMP par la date de la sauvegarde)
sudo cp /var/n8n/.env.backup.TIMESTAMP /var/n8n/.env
sudo cp /var/n8n/ecosystem.config.js.backup.TIMESTAMP /var/n8n/ecosystem.config.js
sudo chown n8n:n8n /var/n8n/.env /var/n8n/ecosystem.config.js
sudo -u n8n pm2 restart n8n
```

## Notes importantes

- ⚠️ **Le script sauvegarde automatiquement** votre configuration avant toute modification
- ⚠️ **N8N sera arrêté** pendant l'installation (quelques secondes)
- ⚠️ **Les workflows existants** ne seront pas affectés (données sauvegardées dans `/var/n8n/data`)
- ✅ **La configuration** (.env, ecosystem.config.js) est préservée

## Mise à jour future

Pour mettre à jour vers une version plus récente plus tard :

```bash
# Installer une version spécifique
sudo -u n8n npm install -g n8n@VERSION
cd /var/n8n
sudo -u n8n npm install n8n@VERSION --save --save-exact
sudo -u n8n pm2 restart n8n
```



