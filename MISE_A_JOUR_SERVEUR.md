# 🚀 MISE À JOUR SERVEUR - Module Facturation

**Date** : 2 Janvier 2026  
**Commit** : Module Facturation - Interface complète + Documentation  
**Durée** : 10 minutes

---

## ✅ ÉTAPE 1 : CONNEXION SSH

```bash
ssh root@62.171.152.132
```

**Mot de passe** : [votre mot de passe VPS]

---

## ✅ ÉTAPE 2 : NAVIGUER VERS LE PROJET

```bash
cd /var/www/talosprime
```

---

## ✅ ÉTAPE 3 : RÉCUPÉRER LES CHANGEMENTS

```bash
git pull origin main
```

**✅ Résultat attendu** :

```
From github.com:cyrilmedde-png/gestentauto
 * branch            main       -> FETCH_HEAD
Updating 0a48ef4..e3f842b
Fast-forward
 ETAT_WORKFLOWS_JANVIER_2026.md                    | XXX +++++++++++++++++
 INDEX_DOCUMENTATION.md                            | XXX +++++++++++++++++
 LISEZ_MOI_FACTURATION.md                          | XXX +++++++++++++++++
 REPONSE_MODULE_FACTURATION.md                     | XXX +++++++++++++++++
 app/facturation/page.tsx                          | XXX +++++++++++++++++
 docs/GUIDE_ACTIVATION_MODULE_FACTURATION.md       | XXX +++++++++++++++++
 docs/MODULE_FACTURATION_RESUME.md                 | XXX +++++++++++++++++
 7 files changed, 3154 insertions(+)
```

---

## ✅ ÉTAPE 4 : VÉRIFIER LES NOUVEAUX FICHIERS

```bash
# Vérifier interface facturation
ls -la app/facturation/

# Vérifier documentation
ls -la docs/GUIDE_ACTIVATION_MODULE_FACTURATION.md

# Vérifier workflows N8N
ls -la n8n-workflows/facturation/
```

**✅ Vous devriez voir** :
- `app/facturation/page.tsx`
- Tous les fichiers de documentation
- 6 workflows JSON dans `n8n-workflows/facturation/`

---

## ✅ ÉTAPE 5 : INSTALLER DÉPENDANCES (si nécessaire)

```bash
npm install
```

**Note** : Normalement pas nécessaire car pas de nouvelles dépendances

---

## ✅ ÉTAPE 6 : BUILD PRODUCTION

```bash
npm run build
```

**⚠️ IMPORTANT** : Vérifier qu'il n'y a **AUCUNE ERREUR** !

**✅ Résultat attendu** :

```
   Creating an optimized production build ...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                                Size     First Load JS
┌ ○ /                                      XXX kB        XXX kB
├ ○ /facturation                           XXX kB        XXX kB  ← NOUVEAU !
...

○  (Static)  prerendered as static content

✓ Built in XXs
```

---

## ✅ ÉTAPE 7 : REDÉMARRER PM2

```bash
pm2 restart talosprime
```

**✅ Résultat attendu** :

```
[PM2] Applying action restartProcessId on app [talosprime](ids: [ 0 ])
[PM2] [talosprime](0) ✓
┌─────┬──────────────┬─────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │ uptime  │
├─────┼──────────────┼─────────┼─────────┼─────────┤
│ 0   │ talosprime   │ online  │ 1       │ 0s      │
└─────┴──────────────┴─────────┴─────────┴─────────┘
```

---

## ✅ ÉTAPE 8 : VÉRIFIER LES LOGS

```bash
pm2 logs talosprime --lines 50
```

**✅ Vérifier qu'il n'y a AUCUNE ERREUR rouge**

Appuyer sur `Ctrl + C` pour sortir des logs

---

## ✅ ÉTAPE 9 : VÉRIFIER STATUS PM2

```bash
pm2 status
```

**✅ Résultat attendu** :

```
┌─────┬──────────────┬─────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │ uptime  │
├─────┼──────────────┼─────────┼─────────┼─────────┤
│ 0   │ talosprime   │ online  │ 1       │ XXs     │
└─────┴──────────────┴─────────┴─────────┴─────────┘
```

**Status doit être : "online" ✅**

---

## ✅ ÉTAPE 10 : TESTER L'APPLICATION

### Dans votre navigateur :

```
https://www.talosprimes.com/facturation
```

**✅ Vous devriez voir** :
- Page de facturation
- Statistiques (vides au début)
- Bouton "Nouveau"
- Message si pas encore de documents

**Si ça charge** : ✅ Mise à jour réussie !

---

## ✅ ÉTAPE 11 : VÉRIFIER MODULE DANS MODULES

```
https://www.talosprimes.com/platform/modules
```

**✅ Vous devriez voir** :
- Carte "Facturation"
- Description : "Gestion des devis, factures et paiements"
- Toggle activer/désactiver

---

## 🎯 PROCHAINES ÉTAPES (Optionnel - Plus tard)

### Activer le Module Facturation

Une fois que le serveur est à jour, suivre :

```
📄 docs/GUIDE_ACTIVATION_MODULE_FACTURATION.md
```

**Actions** :
1. Installer base de données (SQL - 10 min)
2. Importer workflows N8N (6 fichiers - 15 min)
3. Activer module dans `/platform/modules` (1 clic)

**Temps total** : 30 minutes

---

## 🆘 EN CAS DE PROBLÈME

### Erreur lors du Build

```bash
# Vérifier les logs d'erreur
npm run build 2>&1 | tee build.log

# Envoyer build.log pour diagnostic
```

### Application ne démarre pas

```bash
# Vérifier logs détaillés
pm2 logs talosprime --lines 100

# Redémarrer complètement
pm2 stop talosprime
pm2 start talosprime
```

### Page 404 sur /facturation

```bash
# Vérifier que le fichier existe
ls -la app/facturation/page.tsx

# Si existe, rebuild
npm run build
pm2 restart talosprime
```

### Rollback si Problème Majeur

```bash
# Revenir à la version précédente
git reset --hard 0a48ef4
npm run build
pm2 restart talosprime
```

**⚠️ Contactez le support si problème persiste**

---

## 📊 CHECKLIST FINALE

- [ ] SSH connecté au serveur
- [ ] `git pull origin main` réussi
- [ ] Nouveaux fichiers visibles
- [ ] `npm run build` sans erreur
- [ ] PM2 redémarré
- [ ] Status PM2 = "online"
- [ ] Logs PM2 sans erreur
- [ ] `/facturation` accessible dans le navigateur
- [ ] Module visible dans `/platform/modules`

---

## ✅ RÉSUMÉ COMMANDES

**Copier-coller ces commandes dans l'ordre** :

```bash
# 1. Connexion
ssh root@62.171.152.132

# 2. Navigation
cd /var/www/talosprime

# 3. Pull
git pull origin main

# 4. Build
npm run build

# 5. Restart
pm2 restart talosprime

# 6. Vérifier status
pm2 status

# 7. Vérifier logs (Ctrl+C pour sortir)
pm2 logs talosprime --lines 50

# 8. Sortir SSH
exit
```

**Temps total** : ~10 minutes

---

## 🎉 TERMINÉ !

Votre serveur est maintenant à jour avec :

- ✅ Interface `/facturation`
- ✅ Module visible dans `/platform/modules`
- ✅ Documentation complète
- ✅ Workflows N8N prêts à activer

**Prochaine étape** : Activer le module facturation (optionnel)
→ Suivre `docs/GUIDE_ACTIVATION_MODULE_FACTURATION.md`

---

**Créé le** : 2 Janvier 2026  
**Version** : 1.0  
**Commit** : e3f842b


