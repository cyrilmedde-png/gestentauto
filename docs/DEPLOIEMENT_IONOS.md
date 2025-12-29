# Guide de Déploiement sur IONOS VPS

## Informations du serveur

- **IP**: 82.165.129.143
- **Utilisateur**: cursor
- **OS**: Ubuntu + N8N

## Étape 1 : Connexion au serveur

```bash
ssh cursor@82.165.129.143
```

## Étape 2 : Installation des dépendances

Exécutez le script de configuration :

```bash
# Télécharger ou copier le script setup-server.sh sur le serveur
# Puis l'exécuter :
bash setup-server.sh
```

Ce script installera :
- Node.js 20.x
- npm
- PM2 (gestionnaire de processus)
- Nginx (serveur web)
- Certbot (certificats SSL)
- Configuration du firewall

## Étape 3 : Configuration Nginx

```bash
# Éditer le script pour changer les domaines si nécessaire
nano setup-nginx.sh

# Exécuter le script
bash setup-nginx.sh
```

## Étape 4 : Configuration des variables d'environnement

```bash
bash setup-env.sh
```

Ou éditez manuellement :
```bash
nano /var/www/talosprime/.env.production
```

Ajoutez toutes les variables nécessaires :
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+336...
NODE_ENV=production
PORT=3000
```

## Étape 5 : Déploiement du code

### Option A : Via Git (recommandé)

```bash
cd /var/www/talosprime
git clone <votre-repo-git> .
bash ../deploy.sh
```

### Option B : Via SCP (transfert de fichiers)

Depuis votre machine locale :
```bash
scp -r . cursor@82.165.129.143:/var/www/talosprime/
```

Puis sur le serveur :
```bash
cd /var/www/talosprime
bash deploy.sh
```

## Étape 6 : Configuration SSL (Let's Encrypt)

Assurez-vous que vos domaines pointent vers l'IP du serveur (82.165.129.143) :

```bash
sudo certbot --nginx -d talosprime.fr -d talosprime.com -d www.talosprime.fr -d www.talosprime.com
```

## Étape 7 : Vérification

```bash
# Vérifier que l'application tourne
pm2 status

# Voir les logs
pm2 logs talosprime

# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx
```

## Commandes utiles

### PM2 (Gestion de l'application)
```bash
pm2 status              # Statut
pm2 logs talosprime     # Logs en temps réel
pm2 restart talosprime  # Redémarrer
pm2 stop talosprime     # Arrêter
pm2 monit               # Monitor en temps réel
```

### Nginx
```bash
sudo nginx -t                    # Tester la config
sudo systemctl reload nginx      # Recharger
sudo systemctl restart nginx     # Redémarrer
sudo systemctl status nginx      # Statut
```

### Déploiement
```bash
cd /var/www/talosprime
git pull
npm install --production
npm run build
pm2 restart talosprime
```

## Sécurité recommandée

### Désactiver la connexion root par SSH

Éditez `/etc/ssh/sshd_config` :
```bash
sudo nano /etc/ssh/sshd_config
```

Changez :
```
PermitRootLogin no
PasswordAuthentication no  # Après avoir configuré les clés SSH
```

Puis :
```bash
sudo systemctl restart sshd
```

### Configurer les clés SSH

Sur votre machine locale :
```bash
ssh-keygen -t ed25519 -C "votre_email@example.com"
ssh-copy-id cursor@82.165.129.143
```

## Troubleshooting

### L'application ne démarre pas
```bash
pm2 logs talosprime --lines 50
```

### Port 3000 déjà utilisé
```bash
sudo lsof -i :3000
# Tuer le processus si nécessaire
```

### Erreurs Nginx
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Problèmes de permissions
```bash
sudo chown -R cursor:cursor /var/www/talosprime
```

## Mise à jour

Pour mettre à jour l'application :

```bash
cd /var/www/talosprime
git pull
npm install --production
npm run build
pm2 restart talosprime
```









