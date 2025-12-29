# Actions Finales pour Résoudre Toutes les Erreurs N8N

## Problèmes Identifiés

1. ❌ **404 pour `/platform/n8n/view`** - Route retourne 404
2. ❌ **404 pour `/rest/workflows/.../executions/last-successful`** - Proxy ne route pas correctement
3. ❌ **CORS pour `api.github.com`** - Requêtes GitHub proxifiées alors qu'elles ne devraient pas l'être
4. ❌ **WebSocket connection failed** - Configuration Nginx WebSocket manquante

## Actions Immédiates sur le Serveur

### 1. Mettre à jour le code
```bash
cd /var/www/talosprime
git pull origin main
```

### 2. Reconstruire l'application
```bash
npm install
npm run build
pm2 restart talosprime
```

### 3. Configurer WebSocket Nginx (CRITIQUE)
```bash
sudo ./scripts/add-websocket-manual.sh
```

OU manuellement :

1. Ouvrir le fichier de configuration :
```bash
sudo nano /etc/nginx/sites-available/talosprime
```

2. Trouver le bloc `server` pour `www.talosprimes.com` et ajouter :

```nginx
    # Proxy WebSocket pour N8N
    location /rest/push {
        proxy_pass https://n8n.talosprimes.com/rest/push;
        proxy_http_version 1.1;
        
        # Headers WebSocket (CRITIQUE)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }
```

3. Tester et recharger :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Vérifier la configuration
```bash
sudo ./scripts/verifier-websocket-nginx.sh
```

Vous devriez voir :
- `[INFO] Configuration location /rest/push trouvée`
- `✓ Header Upgrade configuré`
- `✓ Header Connection configuré`

### 5. Vérifier les logs
```bash
# Logs Next.js
pm2 logs talosprime --err --lines 20

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

## Corrections Appliquées dans le Code

### 1. Exclusion améliorée des domaines externes
- Liste exhaustive des domaines à exclure (github.com, api.github.com, etc.)
- Vérification case-insensitive
- Exclusion PRIORITAIRE avant toute autre vérification

### 2. Routes proxy vérifiées
- `/api/platform/n8n/proxy/[...path]` - Gère toutes les routes N8N
- `/rest/[...path]` - Gère les routes REST N8N
- Les deux routes devraient fonctionner correctement

## Vérification Finale

Après toutes les actions :

1. ✅ Vider le cache du navigateur (Ctrl+Shift+Delete)
2. ✅ Accéder à `https://www.talosprimes.com/platform/n8n`
3. ✅ Vérifier la console du navigateur :
   - Pas d'erreur 404 pour `/platform/n8n/view`
   - Pas d'erreur 404 pour `/rest/workflows/...`
   - Pas d'erreur CORS pour `api.github.com`
   - Pas d'erreur WebSocket
   - Pas de "Connection lost" dans N8N

## Si les Erreurs Persistent

### Erreur 404 pour `/platform/n8n/view`
- Vérifier les logs PM2 : `pm2 logs talosprime --err`
- Vérifier que l'utilisateur est bien un admin plateforme
- Vérifier la route : `curl -I https://www.talosprimes.com/platform/n8n/view`

### Erreur 404 pour `/rest/workflows/...`
- Vérifier que la requête arrive au proxy : `pm2 logs talosprime | grep workflows`
- Vérifier que N8N répond : `curl https://n8n.talosprimes.com/rest/workflows`
- Vérifier l'authentification : la route nécessite un admin plateforme

### Erreur CORS pour `api.github.com`
- Normal, ces requêtes ne doivent PAS être proxifiées
- L'erreur CORS est attendue et n'affecte pas le fonctionnement
- Si l'erreur persiste, vérifier que le script d'interception est bien injecté

### Erreur WebSocket
- Vérifier que la configuration est dans Nginx : `sudo grep -A 10 "location /rest/push" /etc/nginx/sites-available/talosprime`
- Vérifier que Nginx est rechargé : `sudo systemctl status nginx`
- Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
- Tester la connexion : `wscat -c wss://www.talosprimes.com/rest/push` (si wscat installé)

## Scripts Disponibles

- `./scripts/diagnostic-n8n-complete.sh` - Diagnostic complet
- `./scripts/verifier-websocket-nginx.sh` - Vérifier config WebSocket
- `./scripts/add-websocket-manual.sh` - Ajouter config WebSocket
- `./scripts/fix-n8n-cors-nginx.sh` - Configurer CORS telemetry
- `./scripts/update-n8n-fix.sh` - Mettre à jour l'application

## Ordre d'Exécution Recommandé

1. `git pull origin main`
2. `npm install && npm run build && pm2 restart talosprime`
3. `sudo ./scripts/add-websocket-manual.sh`
4. `sudo systemctl reload nginx`
5. `sudo ./scripts/verifier-websocket-nginx.sh`
6. Vérifier dans le navigateur








