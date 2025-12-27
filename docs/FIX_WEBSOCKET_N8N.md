# Correction des erreurs WebSocket N8N

## Problème identifié

Les erreurs `Connection lost, code=1008` étaient causées par le fait que les WebSockets `/rest/push` étaient interceptés par le proxy Next.js, alors que Next.js ne supporte pas les WebSockets nativement.

## Solution appliquée

### 1. Exclusion des WebSockets dans le code JavaScript

Les fichiers suivants ont été modifiés pour exclure les WebSockets de l'interception :
- `app/api/platform/n8n/proxy/[...path]/route.ts`
- `app/api/platform/n8n/proxy/route.ts`

**Modifications :**
- Ajout d'une exclusion prioritaire dans `shouldProxy()` pour `/rest/push`, `ws://` et `wss://`
- Vérification supplémentaire dans la section des URLs absolues pour exclure `/rest/push`

Les WebSockets ne seront plus interceptés par le proxy Next.js et pourront se connecter directement via Nginx.

### 2. Configuration Nginx requise (sur le serveur)

**⚠️ IMPORTANT :** Les WebSockets doivent être proxifiés directement par Nginx vers N8N.

Sur votre serveur, exécutez :

```bash
sudo bash scripts/fix-websocket-nginx.sh
```

Ou configurez manuellement dans `/etc/nginx/sites-available/talosprime` :

```nginx
# Dans le bloc server pour www.talosprimes.com
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
```

Puis recharger Nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Vérification

### 1. Vérifier la configuration Nginx

```bash
# Vérifier que la config existe
sudo grep -A 10 "location /rest/push" /etc/nginx/sites-available/talosprime

# Vérifier que Nginx proxifie vers N8N (pas Next.js)
sudo grep -A 10 "location /rest/push" /etc/nginx/sites-available/talosprime | grep proxy_pass
```

La sortie devrait montrer `proxy_pass https://n8n.talosprimes.com/rest/push;` (ou `http://localhost:5678/rest/push` si N8N est en local).

### 2. Tester la connexion WebSocket

Après avoir déployé le code et configuré Nginx :

1. Accédez à `https://www.talosprimes.com/platform/n8n`
2. Ouvrez la console du navigateur (F12)
3. Les erreurs `Connection lost, code=1008` devraient avoir disparu
4. Le banner "Connection lost" dans N8N devrait disparaître

### 3. Vérifier les logs

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/error.log

# Logs N8N
sudo -u n8n pm2 logs n8n
```

## Résumé des changements

✅ **Code modifié :**
- Exclusion des WebSockets dans `shouldProxy()`
- Vérification supplémentaire pour les URLs absolues

⏳ **À faire sur le serveur :**
1. Déployer le code modifié
2. Configurer Nginx pour proxifier `/rest/push` vers N8N
3. Recharger Nginx
4. Vérifier que les WebSockets fonctionnent

## Notes importantes

- Les WebSockets **ne peuvent pas** passer par Next.js (limitation technique)
- Les WebSockets **doivent** passer directement par Nginx vers N8N
- La configuration Nginx est **critique** pour que les WebSockets fonctionnent
- Les autres routes `/rest/*` continuent de passer par le proxy Next.js (sauf `/rest/push`)

## Erreurs normales (non bloquantes)

- `403` pour `/rest/ai/sessions/metadata` : Fonctionnalité premium, normal
- `404` pour `/rest/workflows/.../executions/last-successful` : Normal si pas d'exécutions réussies

Ces erreurs n'affectent pas le fonctionnement de N8N.



