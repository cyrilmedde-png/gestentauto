# 📋 Étapes suivantes - Configuration et déploiement

## ✅ Serveur configuré avec succès !

Vos versions :
- Node.js v20.19.6 ✅
- npm 10.8.2 ✅
- PM2 6.0.14 ✅
- Nginx 1.24.0 ✅

---

## 🔧 Étape 1 : Configurer les variables d'environnement

Sur le serveur, créez le fichier de configuration :

```bash
nano /var/www/talosprime/.env.production
```

**Collez ces lignes** (remplacez les `...` par vos vraies clés) :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Resend (Email)
RESEND_API_KEY=re_votre_cle_resend
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACvotre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678

# Application
NODE_ENV=production
PORT=3000
```

**Pour sauvegarder :** `Ctrl+X`, puis `Y`, puis `Entrée`

---

## 📦 Étape 2 : Déployer votre code

### Option A : Via Git (recommandé)

Si votre code est sur GitHub/GitLab :

```bash
cd /var/www/talosprime
git clone https://github.com/votre-username/votre-repo.git .
npm install --production
npm run build
```

### Option B : Via transfert de fichiers

1. **Sur votre Mac**, compressez le projet :
   - Allez dans le dossier du projet
   - Clic droit → Compresser

2. **Transférez sur le serveur** (depuis votre Mac) :
   ```bash
   scp "gestion complete automatiser.zip" cursor@82.165.129.143:/var/www/talosprime/
   ```

3. **Sur le serveur** :
   ```bash
   cd /var/www/talosprime
   unzip "gestion complete automatiser.zip"
   cd "gestion complete automatiser"
   npm install --production
   npm run build
   ```

---

## ▶️ Étape 3 : Démarrer l'application

```bash
cd /var/www/talosprime
pm2 start npm --name "talosprime" -- start
pm2 save
pm2 startup systemd -u cursor --hp /home/cursor | sudo bash
```

**Vérifier que ça tourne :**
```bash
pm2 status
pm2 logs talosprime
```

---

## 🔒 Étape 4 : Configurer SSL (après avoir pointé les domaines)

**Important :** Cette étape se fait APRÈS avoir configuré les DNS pour que `talosprime.fr` et `talosprime.com` pointent vers `82.165.129.143`

```bash
sudo certbot --nginx -d talosprime.fr -d talosprime.com -d www.talosprime.fr -d www.talosprime.com
```

---

## ✅ Commandes utiles

### Voir les logs
```bash
pm2 logs talosprime
```

### Redémarrer l'app
```bash
pm2 restart talosprime
```

### Arrêter l'app
```bash
pm2 stop talosprime
```

### Voir le statut
```bash
pm2 status
```

---

## 📝 Prochaines étapes dans le code

Une fois le serveur prêt :
1. ✅ Créer les services email/SMS (Resend + Twilio)
2. ✅ Créer le questionnaire frontend
3. ✅ Intégrer l'envoi automatique dans le workflow

---

💡 **Besoin d'aide ?** Dites-moi à quelle étape vous êtes bloqué !

