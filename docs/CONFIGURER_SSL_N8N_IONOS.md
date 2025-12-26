# 🔐 Configuration SSL pour n8n.talosprimes.com (IONOS)

## 📋 Contexte

Avec IONOS, le certificat SSL activé pour `talosprimes.com` couvre automatiquement tous les sous-domaines, y compris `n8n.talosprimes.com`. Cependant, Nginx doit être configuré pour utiliser ce certificat.

## 🚀 Installation automatique

### Sur le serveur :

**Version recommandée (v2 - plus robuste) :**
```bash
cd /var/www/talosprime
git pull origin main
sudo bash scripts/configure-n8n-ssl-ionos-v2.sh
```

**Version originale :**
```bash
sudo bash scripts/configure-n8n-ssl-ionos.sh
```

**💡 Recommandation : Utilisez la version v2** qui crée un fichier de configuration séparé pour n8n.talosprimes.com, évitant les problèmes de modification du fichier principal.

Le script va :
1. ✅ Trouver la configuration Nginx existante
2. ✅ Localiser le certificat SSL IONOS
3. ✅ Ajouter la configuration HTTPS pour n8n.talosprimes.com
4. ✅ Configurer la redirection HTTP → HTTPS
5. ✅ Tester et recharger Nginx

## 🔍 Vérification manuelle

### 1. Vérifier que le certificat existe

```bash
# Chercher le certificat SSL
ls -la /etc/letsencrypt/live/talosprimes.com/
# Ou
ls -la /etc/letsencrypt/live/www.talosprimes.com/
```

### 2. Vérifier la configuration Nginx

```bash
# Voir la configuration pour n8n
grep -A 20 "server_name.*n8n.talosprimes.com" /etc/nginx/sites-available/*
```

### 3. Tester le certificat SSL

```bash
# Test HTTPS
curl -I https://n8n.talosprimes.com

# Vérifier le certificat
openssl s_client -connect n8n.talosprimes.com:443 -servername n8n.talosprimes.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -dates
```

## 📝 Configuration ajoutée

Le script ajoute cette configuration à votre fichier Nginx :

```nginx
# Configuration SSL pour N8N (n8n.talosprimes.com)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name n8n.talosprimes.com;
    
    # Certificat SSL (IONOS couvre les sous-domaines)
    ssl_certificate /etc/letsencrypt/live/talosprimes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talosprimes.com/privkey.pem;
    
    # Configuration SSL recommandée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Autoriser l'iframe depuis www.talosprimes.com
    add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
    
    # Proxy vers N8N
    location / {
        proxy_pass http://localhost:5678;
        # ... configuration proxy
    }
    
    # WebSocket pour N8N
    location /rest/push {
        proxy_pass http://localhost:5678/rest/push;
        # ... configuration WebSocket
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name n8n.talosprimes.com;
    
    return 301 https://$server_name$request_uri;
}
```

## ⚠️ Troubleshooting

### Erreur : "Certificat SSL non trouvé"

**Solution :**
1. Vérifiez que le certificat SSL est activé dans le panel IONOS
2. Vérifiez où se trouve le certificat :
   ```bash
   find /etc/letsencrypt -name "fullchain.pem" 2>/dev/null
   grep -r "ssl_certificate" /etc/nginx/sites-available/ | head -5
   ```
3. Si le certificat est ailleurs, modifiez le script ou configurez manuellement

### Erreur : "Configuration Nginx invalide"

**Solution :**
1. Vérifiez la syntaxe :
   ```bash
   nginx -t
   ```
2. Consultez les erreurs et corrigez la configuration
3. Le script restaure automatiquement la sauvegarde en cas d'erreur

### N8N non accessible après configuration

**Vérifications :**
1. N8N tourne-t-il ?
   ```bash
   pm2 list | grep n8n
   ```
2. Nginx est-il rechargé ?
   ```bash
   systemctl status nginx
   systemctl reload nginx
   ```
3. Les logs Nginx :
   ```bash
   tail -f /var/log/nginx/error.log
   ```

## 🔄 Si le certificat change

Si IONOS renouvelle ou change le certificat :

1. Le script détecte automatiquement le nouveau certificat
2. Ou exécutez à nouveau le script :
   ```bash
   sudo bash scripts/configure-n8n-ssl-ionos.sh
   ```

## 📚 Ressources

- [Documentation IONOS SSL](https://www.ionos.fr/assistance/domaines/ssl-certificats/)
- [Documentation Nginx SSL](https://nginx.org/en/docs/http/configuring_https_servers.html)

