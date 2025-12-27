# Résolution des Erreurs 404 et WebSocket N8N

## Problèmes Identifiés

### 1. ❌ 404 Error sur `/platform/n8n`
**Symptôme** : Page 404 affichée au lieu de l'interface N8N

**Cause** : La route `/platform/n8n/view` n'est pas accessible ou retourne 404

**Solution** :
1. Vérifier que la route existe : `app/platform/n8n/view/route.ts`
2. Vérifier l'authentification : La route nécessite un admin plateforme
3. Vérifier les logs PM2 pour voir l'erreur exacte

### 2. ❌ 404 pour `/rest/workflows/...`
**Symptôme** : `GET https://www.talosprimes.com/api/platform/n8n/proxy/rest/workflows/... 404 (Not Found)`

**Cause** : Le proxy Next.js ne route pas correctement les requêtes vers N8N

**Vérifications** :
1. La route `/app/api/platform/n8n/proxy/[...path]/route.ts` existe
2. Le chemin est correctement parsé : `/${resolvedParams.path.join('/')}`
3. L'authentification passe (admin plateforme requis)

**Solution** :
```bash
# Sur le serveur, exécuter le diagnostic
./scripts/diagnostic-n8n-complete.sh
```

### 3. ❌ WebSocket connection failed
**Symptôme** : `WebSocket connection to 'wss://www.talosprimes.com/rest/push?pushRef=...' failed`

**Cause** : La configuration Nginx WebSocket n'est pas correcte ou Nginx n'a pas été rechargé

**Solution Étape par Étape** :

#### Étape 1 : Vérifier la configuration WebSocket
```bash
sudo ./scripts/verifier-websocket-nginx.sh
```

Ce script vérifie :
- Si la configuration `location /rest/push` existe
- Si les headers WebSocket sont corrects (Upgrade, Connection)
- Si le proxy_pass pointe vers N8N
- Si la configuration est dans le bon bloc server

#### Étape 2 : Si la configuration est manquante ou incorrecte
```bash
sudo ./scripts/setup-websocket-proxy.sh
```

#### Étape 3 : Vérifier que Nginx est rechargé
```bash
# Vérifier le statut
sudo systemctl status nginx

# Recharger si nécessaire
sudo systemctl reload nginx

# Vérifier les logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

#### Étape 4 : Vérifier que la configuration est dans le bon bloc server
La configuration WebSocket DOIT être dans le bloc `server` pour `www.talosprimes.com`, pas dans un autre bloc.

Exemple de configuration correcte :
```nginx
server {
    listen 443 ssl http2;
    server_name www.talosprimes.com;
    
    # ... autres configurations ...
    
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
        
        # Authentification Basic Auth pour N8N (si nécessaire)
        # proxy_set_header Authorization "Basic ...";
        
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }
}
```

#### Étape 5 : Tester la connexion WebSocket
```bash
# Installer wscat si nécessaire
npm install -g wscat

# Tester la connexion
wscat -c wss://www.talosprimes.com/rest/push
```

Si la connexion échoue, vérifier :
1. Les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
2. Les logs N8N : `pm2 logs n8n`
3. Que N8N écoute bien sur le port 5678 : `lsof -i :5678`

### 4. ❌ TypeError: Cannot read properties of undefined (reading 'enabled')
**Symptôme** : Erreur JavaScript dans N8N lors de l'initialisation

**Cause** : N8N ne peut pas initialiser correctement à cause des autres erreurs (WebSocket, 404)

**Solution** : Résoudre d'abord les problèmes WebSocket et 404, cette erreur devrait disparaître.

## Diagnostic Complet

Pour diagnostiquer tous les problèmes en une fois :

```bash
# Sur le serveur
cd /var/www/talosprime
./scripts/diagnostic-n8n-complete.sh
```

Ce script vérifie :
1. ✅ N8N dans PM2
2. ✅ Port 5678 en écoute
3. ✅ Configuration Nginx WebSocket
4. ✅ Configuration Nginx CORS telemetry
5. ✅ Connexion N8N directe
6. ✅ Proxy Next.js
7. ✅ Route /rest/workflows
8. ✅ Route /platform/n8n/view
9. ✅ Variables d'environnement
10. ✅ Logs PM2

## Actions Immédiates

### 1. Mettre à jour le code
```bash
cd /var/www/talosprime
./scripts/update-n8n-fix.sh
```

### 2. Exécuter le diagnostic
```bash
./scripts/diagnostic-n8n-complete.sh
```

### 3. Vérifier la configuration WebSocket
```bash
sudo ./scripts/verifier-websocket-nginx.sh
```

### 4. Si la configuration WebSocket est incorrecte
```bash
sudo ./scripts/setup-websocket-proxy.sh
```

### 5. Configurer CORS pour telemetry (si nécessaire)
```bash
sudo ./scripts/fix-n8n-cors-nginx.sh
```

### 6. Recharger Nginx
```bash
sudo systemctl reload nginx
```

### 7. Redémarrer Next.js
```bash
pm2 restart talosprime
```

### 8. Vérifier les logs
```bash
# Logs Nginx
sudo tail -f /var/log/nginx/error.log

# Logs Next.js
pm2 logs talosprime --err

# Logs N8N
pm2 logs n8n --err
```

## Points Critiques

1. **La configuration WebSocket DOIT être dans le bloc server pour `www.talosprimes.com`**
   - Pas dans un autre bloc server
   - Pas en dehors d'un bloc server

2. **Nginx DOIT être rechargé après chaque modification**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Les headers WebSocket sont CRITIQUES**
   - `Upgrade: $http_upgrade`
   - `Connection: "upgrade"`
   - Sans ces headers, les WebSockets ne fonctionneront jamais

4. **Le proxy_pass DOIT pointer vers N8N**
   - `proxy_pass https://n8n.talosprimes.com/rest/push;`
   - Pas vers `http://localhost:5678` (sauf si N8N est sur le même serveur)

5. **Les timeouts DOIVENT être élevés pour WebSocket**
   - `proxy_read_timeout 86400;` (24 heures)
   - `proxy_send_timeout 86400;` (24 heures)

## Vérification Finale

Après toutes les corrections, vérifier :

1. ✅ Pas d'erreur 404 sur `/platform/n8n`
2. ✅ Pas d'erreur 404 sur `/rest/workflows/...`
3. ✅ Pas d'erreur WebSocket dans la console
4. ✅ "Connection lost" disparaît dans N8N
5. ✅ Les workflows se chargent correctement

Si tout fonctionne, vous devriez voir :
- L'interface N8N se charge sans erreur
- Pas de "Connection lost"
- Les workflows s'affichent
- Pas d'erreurs dans la console du navigateur




