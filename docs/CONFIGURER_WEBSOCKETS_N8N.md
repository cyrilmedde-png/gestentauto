# Configuration WebSockets pour N8N

## Problème

Les WebSockets de N8N (`wss://www.talosprimes.com/rest/push`) ne peuvent pas être proxifiés par Next.js car les API Routes sont serverless et ne supportent pas les WebSockets.

## Solution : Configuration Nginx

Il faut configurer Nginx pour proxifier directement les WebSockets vers N8N, en contournant Next.js.

### Configuration Nginx

Ajouter cette configuration dans `/etc/nginx/sites-available/talosprimes.com` :

```nginx
# Proxy WebSocket pour N8N
location /rest/push {
    proxy_pass https://n8n.talosprimes.com/rest/push;
    proxy_http_version 1.1;
    
    # Headers WebSocket
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
    
    # Authentification Basic Auth pour N8N
    proxy_set_header Authorization "Basic <BASE64_ENCODED_CREDENTIALS>";
    
    # SSL
    proxy_ssl_verify off;
    proxy_ssl_server_name on;
}
```

### Générer les credentials Basic Auth

```bash
# Remplacer USERNAME et PASSWORD par vos credentials N8N
echo -n "USERNAME:PASSWORD" | base64
```

### Appliquer la configuration

```bash
sudo nginx -t  # Tester la configuration
sudo systemctl reload nginx  # Recharger Nginx
```

## Alternative : Script d'automatisation

Un script `scripts/setup-websocket-proxy.sh` peut être créé pour automatiser cette configuration.

