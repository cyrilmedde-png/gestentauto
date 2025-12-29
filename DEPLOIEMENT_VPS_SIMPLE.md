# 🚀 Déploiement VPS - Guide Simple

## ✅ Changements déjà poussés sur GitHub

**Commit :** `b34fd1f` - Fix N8N rechargement onglet  
**Statut :** ✅ Poussé sur GitHub avec succès

---

## 📋 Ce que vous devez faire sur le VPS

### **Option 1 : Script Automatique (Recommandé) ⚡**

Copiez-collez ces commandes **une par une** sur votre serveur VPS :

```bash
# 1. Connectez-vous à votre VPS
ssh root@votre-serveur.com

# 2. Allez dans le dossier du projet
cd /var/www/talosprime

# 3. Téléchargez le script depuis GitHub
git fetch origin
git pull origin main

# 4. Exécutez le script de déploiement automatique
bash scripts/deploy-fix-n8n.sh
```

**C'est tout !** Le script fait automatiquement :
- ✅ Sauvegarde des modifications locales
- ✅ Récupération des changements GitHub
- ✅ Installation des dépendances
- ✅ Build de production
- ✅ Redémarrage de l'application
- ✅ Vérifications post-déploiement

**⏱️ Durée :** 3-5 minutes

---

### **Option 2 : Commandes Manuelles** 

Si vous préférez faire manuellement :

```bash
# 1. Connectez-vous au VPS
ssh root@votre-serveur.com

# 2. Allez dans le dossier du projet
cd /var/www/talosprime

# 3. Sauvegardez les modifications locales (si nécessaire)
git stash

# 4. Récupérez les changements depuis GitHub
git pull origin main

# 5. Installez les dépendances (au cas où)
npm install

# 6. Build de production
npm run build

# 7. Redémarrez l'application
pm2 restart talosprime
# OU si vous utilisez systemd :
# sudo systemctl restart talosprime

# 8. Vérifiez les logs
pm2 logs talosprime --lines 20
```

---

## 🧪 Tester après le déploiement

1. **Ouvrez votre application dans le navigateur :**
   ```
   https://www.talosprimes.com/platform/n8n
   ```

2. **Ouvrez la console du navigateur (F12)**

3. **Testez le changement d'onglet :**
   - Changez d'onglet (allez sur un autre onglet)
   - Attendez 10 secondes
   - Revenez sur l'onglet de l'application

4. **Vérifiez :**
   - ✅ N8N ne devrait **PAS** recharger
   - ✅ Dans la console : `"Retour sur l'onglet N8N - iframe préservée"`
   - ✅ L'interface reste exactement comme vous l'avez laissée

---

## ❓ Problèmes courants

### **Problème : "Permission denied" lors du git pull**

**Solution :**
```bash
# Vérifiez que vous êtes dans le bon dossier
pwd
# Devrait afficher : /var/www/talosprime (ou similaire)

# Vérifiez les permissions
ls -la

# Si nécessaire, changez le propriétaire
sudo chown -R $USER:$USER .
```

---

### **Problème : Build échoue**

**Solution :**
```bash
# Supprimez le cache et rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

### **Problème : Application ne redémarre pas**

**Solution :**
```bash
# Vérifiez les processus PM2
pm2 list

# Si l'application est en erreur
pm2 delete talosprime
pm2 start npm --name talosprime -- start

# Vérifiez les logs
pm2 logs talosprime
```

---

### **Problème : N8N recharge toujours**

**Solutions :**

1. **Videz le cache du navigateur :**
   - Chrome : Ctrl+Shift+Delete (ou Cmd+Shift+Delete sur Mac)
   - Cochez "Cached images and files"
   - Cliquez "Clear data"

2. **Rechargement forcé :**
   - Windows : Ctrl+Shift+R
   - Mac : Cmd+Shift+R

3. **Vérifiez que le bon fichier est déployé :**
   ```bash
   # Sur le serveur
   grep -A 5 "iframeElementRef" app/platform/n8n/page.tsx
   
   # Devrait afficher du code avec iframeElementRef
   ```

---

## 📞 Besoin d'aide ?

**Si ça ne fonctionne pas :**

1. **Envoyez-moi les logs :**
   ```bash
   pm2 logs talosprime --lines 50 --nostream
   ```

2. **Envoyez-moi la sortie de :**
   ```bash
   git log -1 --oneline
   pm2 list
   curl -I https://www.talosprimes.com
   ```

3. **Screenshot de la console navigateur (F12)**

---

## 📝 Checklist rapide

- [ ] Connecté au VPS
- [ ] Dans le dossier `/var/www/talosprime`
- [ ] `git pull origin main` exécuté
- [ ] `npm run build` réussi
- [ ] Application redémarrée (PM2)
- [ ] Test changement d'onglet : ✅ N8N ne recharge pas

---

## 🎯 Résumé ultra-court

```bash
# Sur votre VPS, exécutez dans l'ordre :
ssh root@votre-serveur.com
cd /var/www/talosprime
bash scripts/deploy-fix-n8n.sh
```

**C'est tout ! 🎉**

Ensuite testez sur `https://www.talosprimes.com/platform/n8n`

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- `docs/DEPLOYER_FIX_N8N_VPS.md` - Guide complet
- `docs/FIX_N8N_RELOAD_ONGLET.md` - Explication technique
- `docs/TEST_N8N_NO_RELOAD.md` - Tests détaillés

