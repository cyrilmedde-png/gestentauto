# 🚀 Déployer le fix N8N sur le serveur VPS

## 📋 Résumé des changements

**Commit :** `b34fd1f` - "fix: empêcher rechargement N8N au changement d'onglet"

**Fichiers modifiés :**
- ✅ `app/platform/n8n/page.tsx` - Solution implémentée
- ✅ `docs/FIX_N8N_RELOAD_ONGLET.md` - Documentation
- ✅ `docs/TEST_N8N_NO_RELOAD.md` - Guide de test

---

## 🔧 Étapes de déploiement sur le VPS

### **Étape 1 : Connexion au serveur**

```bash
ssh root@votre-serveur-vps.com
# ou
ssh utilisateur@votre-serveur-vps.com
```

---

### **Étape 2 : Naviguer vers le projet**

```bash
# Aller dans le dossier du projet
cd /var/www/talosprime
# ou le chemin où votre application est déployée
```

---

### **Étape 3 : Vérifier l'état actuel**

```bash
# Voir la branche actuelle
git branch

# Voir les derniers commits
git log --oneline -5

# Vérifier s'il y a des modifications non commitées
git status
```

---

### **Étape 4 : Sauvegarder les modifications locales (si nécessaire)**

```bash
# Si vous avez des modifications locales à sauvegarder
git stash save "Sauvegarde avant mise à jour fix N8N"
```

---

### **Étape 5 : Récupérer les dernières modifications**

```bash
# Récupérer les changements depuis GitHub
git fetch origin

# Voir les différences avec la version locale
git log HEAD..origin/main --oneline

# Mettre à jour la branche main
git pull origin main
```

**Sortie attendue :**
```
remote: Enumerating objects: 8, done.
remote: Counting objects: 100% (8/8), done.
remote: Compressing objects: 100% (5/5), done.
remote: Total 5 (delta 3), reused 5 (delta 3), pack-reused 0
Unpacking objects: 100% (5/5), 15.42 KiB | 789.00 KiB/s, done.
From github.com:cyrilmedde-png/gestentauto
   a44379a..b34fd1f  main       -> origin/main
Updating a44379a..b34fd1f
Fast-forward
 app/platform/n8n/page.tsx           |  45 +++----
 docs/FIX_N8N_RELOAD_ONGLET.md       | 321 ++++++++++++++++++++++++++++++++++
 docs/TEST_N8N_NO_RELOAD.md          | 248 ++++++++++++++++++++++++++
 3 files changed, 555 insertions(+), 45 deletions(-)
```

---

### **Étape 6 : Vérifier les dépendances**

```bash
# Vérifier si de nouvelles dépendances ont été ajoutées
npm install

# Ou si vous utilisez yarn
yarn install
```

**Note :** Pour ce fix spécifique, aucune nouvelle dépendance n'a été ajoutée.

---

### **Étape 7 : Build de production**

```bash
# Construire la version de production
npm run build

# Vérifier qu'il n'y a pas d'erreurs de build
echo $?
# Devrait afficher 0 si tout s'est bien passé
```

**⏱️ Durée estimée :** 2-5 minutes

---

### **Étape 8 : Redémarrer l'application**

#### **Option A : Si vous utilisez PM2**

```bash
# Lister les processus PM2
pm2 list

# Redémarrer l'application Next.js
pm2 restart talosprime
# ou le nom de votre application PM2

# Voir les logs en temps réel
pm2 logs talosprime --lines 50
```

#### **Option B : Si vous utilisez systemd**

```bash
# Redémarrer le service
sudo systemctl restart talosprime

# Vérifier le statut
sudo systemctl status talosprime

# Voir les logs
sudo journalctl -u talosprime -n 50 -f
```

#### **Option C : Si vous utilisez Docker**

```bash
# Rebuild et redémarrer le container
docker-compose down
docker-compose up -d --build

# Voir les logs
docker-compose logs -f --tail 50
```

---

### **Étape 9 : Vérifier que l'application fonctionne**

```bash
# Tester que l'application répond
curl -I https://www.talosprimes.com

# Devrait retourner HTTP/2 200
```

**Sortie attendue :**
```
HTTP/2 200
content-type: text/html; charset=utf-8
...
```

---

### **Étape 10 : Tester le fix N8N**

1. **Ouvrir l'application dans le navigateur :**
   ```
   https://www.talosprimes.com/platform/n8n
   ```

2. **Ouvrir la console du navigateur (F12)**

3. **Tester le changement d'onglet :**
   - Changer d'onglet pendant 10 secondes
   - Revenir sur l'onglet
   - Vérifier dans la console : `"Retour sur l'onglet N8N - iframe préservée"`
   - ✅ N8N ne devrait pas recharger

4. **Tester avec un workflow ouvert :**
   - Ouvrir un workflow dans N8N
   - Faire des modifications (ne pas sauvegarder)
   - Changer d'onglet
   - Revenir
   - ✅ Les modifications devraient être préservées

---

## 🔍 Vérifications post-déploiement

### **1. Vérifier les logs serveur**

```bash
# PM2
pm2 logs talosprime --lines 100

# Systemd
sudo journalctl -u talosprime -n 100

# Docker
docker-compose logs --tail 100
```

**Rechercher :**
- ❌ Pas d'erreurs JavaScript
- ❌ Pas d'erreurs de build
- ✅ Application démarrée avec succès

---

### **2. Vérifier la version déployée**

```bash
# Voir le dernier commit
git log -1 --oneline

# Devrait afficher : b34fd1f fix: empêcher rechargement N8N au changement d'onglet
```

---

### **3. Tester les autres pages**

```bash
# Tester que les autres pages fonctionnent toujours
curl -I https://www.talosprimes.com/dashboard
curl -I https://www.talosprimes.com/platform/clients
curl -I https://www.talosprimes.com/platform/leads
```

---

## 🐛 Dépannage

### **Problème 1 : Erreur "Cannot find module"**

**Symptôme :**
```
Error: Cannot find module 'xyz'
```

**Solution :**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
rm -f package-lock.json
npm install
npm run build
pm2 restart talosprime
```

---

### **Problème 2 : Build échoue**

**Symptôme :**
```
Build failed with errors
```

**Solution :**
```bash
# Voir les erreurs détaillées
npm run build 2>&1 | tee build-error.log

# Revenir à la version précédente si nécessaire
git reset --hard HEAD~1
npm run build
pm2 restart talosprime

# Puis investiguer le problème
```

---

### **Problème 3 : Application ne démarre pas**

**Symptôme :**
```
pm2 list
# Status: errored
```

**Solution :**
```bash
# Voir les logs d'erreur
pm2 logs talosprime --err --lines 50

# Vérifier les variables d'environnement
pm2 env talosprime

# Redémarrer en mode debug
pm2 delete talosprime
pm2 start npm --name talosprime -- start
pm2 logs talosprime
```

---

### **Problème 4 : N8N recharge toujours**

**Symptômes :**
- L'iframe N8N recharge au changement d'onglet

**Vérifications :**

1. **Vider le cache du navigateur :**
   - Chrome/Edge : Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
   - Firefox : Ctrl+Shift+Delete
   - Safari : Cmd+Alt+E

2. **Forcer le rechargement :**
   - Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)

3. **Vérifier que le bon fichier est déployé :**
   ```bash
   # Sur le serveur
   cat app/platform/n8n/page.tsx | grep "iframeElementRef"
   
   # Devrait afficher les lignes avec iframeElementRef
   ```

4. **Vérifier les logs de la console navigateur :**
   - Ouvrir F12
   - Onglet Console
   - Chercher : `"Retour sur l'onglet N8N - iframe préservée"`

---

## 📊 Checklist de déploiement

Cochez au fur et à mesure :

- [ ] Connexion au serveur VPS
- [ ] Navigation vers le dossier du projet
- [ ] Sauvegarde des modifications locales (si nécessaire)
- [ ] `git pull origin main` réussi
- [ ] `npm install` exécuté
- [ ] `npm run build` réussi
- [ ] Application redémarrée (PM2/systemd/Docker)
- [ ] Application accessible (`curl -I`)
- [ ] Page N8N chargée dans le navigateur
- [ ] Test changement d'onglet : ✅ N8N ne recharge pas
- [ ] Test workflow ouvert : ✅ Modifications préservées
- [ ] Logs serveur : aucune erreur
- [ ] Autres pages fonctionnelles

---

## 🎯 Commandes rapides (Copy-paste)

```bash
# Déploiement complet en une seule fois
cd /var/www/talosprime && \
git stash && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart talosprime && \
pm2 logs talosprime --lines 20
```

**⚠️ Attention :** Vérifiez chaque étape individuellement la première fois !

---

## 🔄 Rollback (retour arrière)

Si le déploiement pose problème :

```bash
# Retourner au commit précédent
git reset --hard a44379a

# Rebuild
npm run build

# Redémarrer
pm2 restart talosprime

# Vérifier
curl -I https://www.talosprimes.com
```

---

## 📞 Support

**Si vous rencontrez des problèmes :**

1. **Vérifier les logs :**
   ```bash
   pm2 logs talosprime --lines 100 --err
   ```

2. **Vérifier la configuration nginx :**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **Vérifier N8N :**
   ```bash
   pm2 list | grep n8n
   pm2 logs n8n --lines 50
   ```

4. **Tester en local d'abord :**
   - Testez sur votre machine locale avant de déployer

---

## ✅ Validation finale

Après le déploiement, vérifiez :

- ✅ L'application est accessible
- ✅ La page N8N se charge
- ✅ N8N ne recharge pas au changement d'onglet
- ✅ Les autres pages fonctionnent
- ✅ Aucune erreur dans les logs

**🎉 Si tout est OK, le déploiement est réussi !**

---

## 📝 Notes importantes

1. **Temps de déploiement estimé :** 5-10 minutes
2. **Downtime :** ~10-30 secondes pendant le redémarrage
3. **Backup :** Les modifications sont dans Git, facile de revenir en arrière
4. **Tests :** Toujours tester sur un environnement de staging si disponible

---

## 📅 Historique

- **2024-12-29** : Déploiement du fix N8N rechargement (commit b34fd1f)



