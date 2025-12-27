# Configuration N8N pour autoriser l'iframe

## Problème

L'iframe vers `n8n.talosprimes.com` est bloquée avec le statut `(blocked:ot...)` à cause de :
- `X-Frame-Options: SAMEORIGIN` dans les headers Nginx
- `Content-Security-Policy` qui bloque les iframes depuis d'autres domaines

## Solution automatique

Exécutez le script de configuration sur le serveur :

```bash
cd /var/www/talosprime
sudo bash scripts/configure-n8n-iframe.sh
```

Ce script :
1. ✅ Configure N8N via PM2 pour autoriser CORS depuis `www.talosprimes.com`
2. ✅ Modifie la configuration Nginx pour autoriser l'iframe
3. ✅ Redémarre N8N et recharge Nginx

## Solution manuelle

### 1. Configuration N8N (variables d'environnement)

Si N8N est géré par PM2, ajoutez dans le fichier de configuration PM2 ou dans le script de démarrage :

```bash
export N8N_CORS_ORIGIN=https://www.talosprimes.com
```

Ou dans `ecosystem.config.js` :

```javascript
{
  name: 'n8n',
  script: 'n8n',
  env: {
    N8N_CORS_ORIGIN: 'https://www.talosprimes.com'
  }
}
```

### 2. Configuration Nginx pour N8N

Dans `/etc/nginx/sites-available/n8n` (ou le fichier de configuration N8N) :

**Supprimer ou commenter :**
```nginx
# add_header X-Frame-Options "SAMEORIGIN" always;
```

**Ajouter :**
```nginx
# Autoriser l'iframe depuis www.talosprimes.com
add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
```

**Configuration complète exemple :**
```nginx
server {
    server_name n8n.talosprimes.com;
    
    # SSL configuration...
    
    # Autoriser l'iframe depuis www.talosprimes.com
    add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Appliquer les changements

```bash
# Tester la configuration Nginx
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Redémarrer N8N
pm2 restart n8n
```

## Vérification

1. Accédez à `https://www.talosprimes.com/platform/n8n`
2. L'iframe devrait maintenant charger N8N sans erreur
3. Vérifiez la console du navigateur (F12) - il ne devrait plus y avoir d'erreur `(blocked:ot...)`

## Dépannage

### Si l'iframe est toujours bloquée

1. **Vérifier les headers Nginx** :
```bash
curl -I https://n8n.talosprimes.com | grep -i "frame\|csp"
```

Vous devriez voir :
```
Content-Security-Policy: frame-ancestors 'self' https://www.talosprimes.com
```

Et **PAS** :
```
X-Frame-Options: SAMEORIGIN
```

2. **Vérifier les logs Nginx** :
```bash
sudo tail -f /var/log/nginx/error.log
```

3. **Vérifier les logs N8N** :
```bash
pm2 logs n8n --lines 50
```

4. **Vérifier que N8N a bien redémarré** :
```bash
pm2 list | grep n8n
pm2 info n8n
```

### Si N8N ne redémarre pas

```bash
# Arrêter N8N
pm2 stop n8n

# Vérifier les variables d'environnement
pm2 env n8n

# Redémarrer N8N
pm2 start n8n

# Sauvegarder la configuration PM2
pm2 save
```

## Notes importantes

- ⚠️ **Sécurité** : Autoriser l'iframe depuis `www.talosprimes.com` uniquement, pas depuis tous les domaines
- ⚠️ **CORS** : `N8N_CORS_ORIGIN` permet aussi les requêtes CORS depuis l'application principale
- ⚠️ **Cache** : Après modification, vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)

## Alternative : Utiliser le proxy Next.js

Si la configuration N8N ne fonctionne pas, vous pouvez revenir au proxy Next.js (mais avec les problèmes de WebSocket potentiels) :

Modifier `app/platform/n8n/page.tsx` :
```tsx
<iframe src="/platform/n8n/view" ... />
```

Au lieu de :
```tsx
<iframe src="https://n8n.talosprimes.com" ... />
```



