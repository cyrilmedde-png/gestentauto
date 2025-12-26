# 🔧 Fix : Erreur EADDRINUSE - Port 3000 déjà utilisé

## Problème

L'application ne peut pas démarrer car le port 3000 est déjà utilisé :
```
Error: listen EADDRINUSE: address already in use :::3000
```

## Solution : Libérer le port 3000

### Sur le serveur, exécuter ces commandes :

```bash
# 1. Trouver quel processus utilise le port 3000
sudo lsof -i :3000

# Ou avec netstat
sudo netstat -tlnp | grep :3000

# 2. Tuer le processus (remplacer PID par le numéro du processus trouvé)
sudo kill -9 PID

# 3. Vérifier que PM2 n'a pas plusieurs instances
pm2 list

# 4. Arrêter toutes les instances PM2
pm2 stop all
pm2 delete all

# 5. Redémarrer l'application
cd /var/www/talosprime
pm2 start npm --name "talosprime" -- start
# ou
pm2 start ecosystem.config.js  # si vous avez un fichier ecosystem

# 6. Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

## Solution alternative : Utiliser un autre port

Si vous voulez utiliser un autre port (par exemple 3001) :

1. **Créer un fichier `.env.local`** sur le serveur :
```bash
cd /var/www/talosprime
echo "PORT=3001" >> .env.local
```

2. **Ou modifier le script PM2** pour spécifier le port :
```bash
pm2 start npm --name "talosprime" -- start -- -p 3001
```

3. **Mettre à jour Nginx** si nécessaire pour pointer vers le nouveau port.

## Vérification

Après avoir libéré le port, vérifier que l'application démarre :

```bash
pm2 logs talosprime --lines 50
```

Vous devriez voir :
- `Ready on http://localhost:3000` (ou le port configuré)
- Plus d'erreur EADDRINUSE



