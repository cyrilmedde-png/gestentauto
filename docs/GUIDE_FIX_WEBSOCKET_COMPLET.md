# Guide complet pour corriger les erreurs WebSocket N8N

## Problème

Les erreurs `Connection lost, code=1008` indiquent que les WebSockets `/rest/push` ne peuvent pas se connecter correctement à N8N.

## Causes possibles

1. **Route Next.js intercepte `/rest/push`** : La route `app/rest/[...path]/route.ts` intercepte toutes les requêtes `/rest/*`, y compris les WebSockets. Next.js ne supporte pas les WebSockets nativement.

2. **Configuration Nginx incorrecte** : 
   - `/rest/push` proxifie vers Next.js au lieu de N8N
   - `/rest/push` est placé APRÈS les autres locations `/rest/` (ordre incorrect)
   - Headers WebSocket manquants

3. **N8N non accessible** : N8N n'est pas démarré ou n'est pas accessible sur le port 5678.

## Solution complète

### Étape 1 : Vérifier l'état actuel

Sur le serveur, exécutez le script de diagnostic :

```bash
cd /var/www/talosprime
sudo bash scripts/diagnostic-complet-websocket.sh
```

Ce script vérifie :
- ✅ Configuration Nginx (`/rest/push` existe et proxifie vers N8N)
- ✅ Ordre des locations ( `/rest/push` doit être AVANT `/rest/`)
- ✅ Accessibilité N8N
- ✅ Statut PM2 de N8N
- ✅ Route Next.js (doit exclure `/rest/push`)

### Étape 2 : Corriger la configuration Nginx

Exécutez le script de correction automatique :

```bash
sudo bash scripts/fix-websocket-nginx.sh
```

Ce script :
- ✅ Détecte automatiquement où N8N est accessible
- ✅ Ajoute ou corrige la configuration `/rest/push`
- ✅ Place `/rest/push` AVANT les autres locations `/rest/`
- ✅ Configure les headers WebSocket corrects
- ✅ Teste la configuration avant de recharger Nginx

### Étape 3 : Vérifier que le code Next.js exclut `/rest/push`

Le fichier `app/rest/[...path]/route.ts` doit exclure `/rest/push` :

```typescript
// EXCLUSION CRITIQUE : Ne JAMAIS intercepter /rest/push (WebSocket)
if (restPath === 'push') {
  return NextResponse.json(
    { error: 'WebSocket endpoint must be handled by Nginx directly' },
    { status: 426 } // 426 Upgrade Required
  )
}
```

Si ce n'est pas le cas, déployez le code mis à jour :

```bash
cd /var/www/talosprime
git pull origin main
npm run build
pm2 restart talosprime
```

### Étape 4 : Vérifier N8N

Assurez-vous que N8N est démarré :

```bash
pm2 list | grep n8n
pm2 logs n8n --lines 50
```

Si N8N n'est pas démarré :

```bash
pm2 start n8n --name n8n
pm2 save
```

### Étape 5 : Recharger Nginx

```bash
sudo nginx -t  # Vérifier la syntaxe
sudo systemctl reload nginx
```

### Étape 6 : Tester

1. Accédez à `https://www.talosprimes.com/platform/n8n`
2. Ouvrez la console du navigateur (F12)
3. Les erreurs `Connection lost, code=1008` devraient avoir disparu
4. Le banner "Connection lost" dans N8N devrait disparaître

## Configuration Nginx correcte

La configuration Nginx doit ressembler à ceci (dans le bon ordre) :

```nginx
server {
    server_name www.talosprimes.com;
    
    # IMPORTANT: /rest/push AVANT les autres locations
    # Les locations plus spécifiques doivent être en premier
    location /rest/push {
        proxy_pass https://n8n.talosprimes.com/rest/push;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host n8n.talosprimes.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # Autres locations /rest/* (plus général, après)
    location /rest/ {
        proxy_pass http://localhost:3000;
        # ... autres headers ...
    }
    
    # Location générale pour Next.js
    location / {
        proxy_pass http://localhost:3000;
        # ... autres headers ...
    }
}
```

## Vérifications manuelles

### Vérifier l'ordre des locations dans Nginx

```bash
sudo grep -n "location /rest" /etc/nginx/sites-available/talosprime
```

La sortie doit montrer que `/rest/push` a un numéro de ligne INFÉRIEUR à `/rest/` :

```
45    location /rest/push {    # ← Doit être en premier
...
120   location /rest/ {         # ← Doit être après
```

### Vérifier que `/rest/push` proxifie vers N8N

```bash
sudo grep -A 5 "location /rest/push" /etc/nginx/sites-available/talosprime | grep proxy_pass
```

La sortie doit montrer :
```
proxy_pass https://n8n.talosprimes.com/rest/push;
```

**PAS** :
```
proxy_pass http://localhost:3000;  # ❌ INCORRECT
```

### Vérifier les logs Nginx

```bash
sudo tail -f /var/log/nginx/error.log
```

Si vous voyez des erreurs liées à `/rest/push`, notez-les et corrigez la configuration.

## Erreurs courantes et solutions

### Erreur : "Connection lost, code=1008"

**Cause** : WebSocket ne peut pas se connecter.

**Solutions** :
1. Vérifier que `/rest/push` proxifie vers N8N (pas Next.js)
2. Vérifier que `/rest/push` est AVANT `/rest/` dans Nginx
3. Vérifier que N8N est démarré : `pm2 list | grep n8n`
4. Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/error.log`

### Erreur : "404 Not Found" pour `/rest/push`

**Cause** : La location `/rest/push` n'existe pas dans Nginx.

**Solution** :
```bash
sudo bash scripts/fix-websocket-nginx.sh
```

### Erreur : Route Next.js intercepte `/rest/push`

**Cause** : Le fichier `app/rest/[...path]/route.ts` n'exclut pas `/rest/push`.

**Solution** :
1. Vérifier que le code exclut `/rest/push` (voir Étape 3)
2. Déployer le code mis à jour
3. Redémarrer l'application : `pm2 restart talosprime`

## Résumé des fichiers modifiés

- ✅ `app/rest/[...path]/route.ts` : Exclut `/rest/push` (retourne 426)
- ✅ `scripts/fix-websocket-nginx.sh` : Amélioré pour placer `/rest/push` au bon endroit
- ✅ `scripts/diagnostic-complet-websocket.sh` : Nouveau script de diagnostic complet

## Notes importantes

- ⚠️ **Next.js ne supporte PAS les WebSockets** : Les WebSockets doivent passer directement par Nginx vers N8N
- ⚠️ **Ordre des locations Nginx** : Les locations plus spécifiques (`/rest/push`) doivent être AVANT les plus générales (`/rest/`)
- ⚠️ **Configuration Nginx critique** : Sans la bonne configuration Nginx, les WebSockets ne fonctionneront jamais, même avec le code correct

## Support

Si les problèmes persistent après avoir suivi ce guide :

1. Exécutez le diagnostic complet : `sudo bash scripts/diagnostic-complet-websocket.sh`
2. Vérifiez les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
3. Vérifiez les logs N8N : `pm2 logs n8n --lines 100`
4. Vérifiez les logs Next.js : `pm2 logs talosprime --lines 100`






