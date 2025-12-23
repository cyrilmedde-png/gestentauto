# 🚀 Installation Simple - TalosPrime sur IONOS

## 📋 Instructions super simples

### Étape 1 : Se connecter au serveur

Ouvrez votre Terminal (sur Mac) et copiez-collez cette ligne :

```bash
ssh cursor@82.165.129.143
```

**Tapez `cursor` comme mot de passe** (vous ne verrez rien à l'écran, c'est normal, tapez quand même)

---

### Étape 2 : Copier-coller les commandes une par une

Une fois connecté, copiez-collez **CHAQUE commande** ci-dessous, **une par une**, et appuyez sur **Entrée** après chaque commande :

#### Commande 1 : Mettre à jour
```bash
sudo apt update && sudo apt upgrade -y
```

#### Commande 2 : Installer les outils
```bash
sudo apt install -y curl wget git build-essential
```

#### Commande 3 : Installer Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

#### Commande 4 : Installer PM2
```bash
sudo npm install -g pm2
```

#### Commande 5 : Installer Nginx
```bash
sudo apt install -y nginx && sudo systemctl start nginx && sudo systemctl enable nginx
```

#### Commande 6 : Installer Certbot (pour SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Commande 7 : Configurer le firewall
```bash
sudo ufw --force enable && sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
```

#### Commande 8 : Créer le dossier de l'app
```bash
sudo mkdir -p /var/www/talosprime && sudo chown -R cursor:cursor /var/www/talosprime
```

#### Commande 9 : Configurer Nginx (copier TOUTE la commande)
```bash
sudo bash -c 'cat > /etc/nginx/sites-available/talosprime << "EOF"
server {
    listen 80;
    server_name talosprime.fr talosprime.com www.talosprime.fr www.talosprime.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF'
```

#### Commande 10 : Activer le site
```bash
sudo ln -sf /etc/nginx/sites-available/talosprime /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default
```

#### Commande 11 : Tester Nginx
```bash
sudo nginx -t
```

#### Commande 12 : Recharger Nginx
```bash
sudo systemctl reload nginx
```

---

### ✅ C'est terminé !

Tout est installé. Vous verrez des messages de confirmation pour chaque étape.

---

## 🔧 Prochaines étapes (plus tard)

1. **Configurer les variables d'environnement** (les clés API)
2. **Déployer votre code**
3. **Configurer SSL** (après avoir pointé les domaines)

---

## 💡 Astuce

Si une commande ne fonctionne pas, **copiez exactement le message d'erreur** et je vous aiderai à le corriger.


