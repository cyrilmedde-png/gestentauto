# 📋 Étapes suivantes - Configuration et déploiement

## ✅ Serveur configuré avec succès !

Vos versions :
- Node.js v20.19.6 ✅
- npm 10.8.2 ✅
- PM2 6.0.14 ✅
- Nginx 1.24.0 ✅

---

## 🔧 Étape 1 : Configurer les variables d'environnement

**⚠️ IMPORTANT :** Les variables `NEXT_PUBLIC_*` doivent être présentes **au moment du BUILD**. Si vous avez déjà fait un build, vous devez REBUILD après avoir créé le fichier `.env.production`.

👉 **Voir le guide détaillé :** `docs/CONFIGURER_ENV_SERVEUR.md`

**Résumé rapide :**

```bash
# 1. Créer le fichier .env.production
nano /var/www/talosprime/.env.production

# 2. Collez vos variables (voir CONFIGURER_ENV_SERVEUR.md pour le template complet)
# Sauvegarder : Ctrl+X, Y, Entrée

# 3. REBUILD (obligatoire !)
pm2 stop talosprime
rm -rf .next
npm run build
pm2 start npm --name "talosprime" -- start
```

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

