# 🧪 Test : N8N sans rechargement au changement d'onglet

## 📋 Checklist de test

### ✅ Test 1 : Changement d'onglet simple

1. Ouvrez votre application dans le navigateur
2. Connectez-vous et naviguez vers la page N8N (`/platform/n8n`)
3. Attendez que N8N soit complètement chargé
4. Ouvrez la console du navigateur (F12)
5. Changez d'onglet (allez sur un autre onglet)
6. Attendez 10-15 secondes
7. Revenez sur l'onglet de l'application

**Résultat attendu :**
- ✅ N8N ne recharge PAS
- ✅ L'interface reste exactement comme vous l'avez laissée
- ✅ Dans la console, vous voyez : `"Retour sur l'onglet N8N - iframe préservée"`
- ❌ Vous ne devriez PAS voir un loader ou une page blanche

---

### ✅ Test 2 : Changement d'onglet avec workflow ouvert

1. Sur la page N8N, ouvrez un workflow existant ou créez-en un nouveau
2. Faites quelques modifications (ajoutez un nœud, modifiez des paramètres)
3. **NE SAUVEGARDEZ PAS** les modifications
4. Changez d'onglet
5. Attendez 10-15 secondes
6. Revenez sur l'onglet

**Résultat attendu :**
- ✅ Le workflow est toujours ouvert
- ✅ Vos modifications non sauvegardées sont toujours là
- ✅ Vous pouvez continuer à travailler immédiatement

---

### ✅ Test 3 : Changements multiples d'onglet

1. Ouvrez N8N
2. Changez d'onglet 5-10 fois de suite
3. Revenez sur l'onglet à chaque fois

**Résultat attendu :**
- ✅ N8N ne recharge jamais
- ✅ Pas de flash ou de rechargement visible

---

### ✅ Test 4 : Longue période en arrière-plan

1. Ouvrez N8N
2. Changez d'onglet
3. Attendez 5 minutes
4. Revenez sur l'onglet

**Résultat attendu :**
- ✅ N8N est toujours actif
- ✅ Pas de rechargement
- ⚠️ Possible : message de reconnexion WebSocket (c'est normal après une longue période)

---

### ✅ Test 5 : Navigation dans l'application

1. Ouvrez N8N
2. Naviguez vers une autre page de l'application (ex: Dashboard, Clients)
3. Revenez sur la page N8N

**Résultat attendu :**
- ⚠️ **ATTENTION** : Avec la solution actuelle, N8N va recharger (c'est normal)
- ℹ️ Pour préserver l'iframe entre les pages, utilisez la Solution 2 (voir documentation)

---

### ✅ Test 6 : Rechargement de la page

1. Ouvrez N8N
2. Rechargez la page (F5 ou Cmd+R)

**Résultat attendu :**
- ✅ N8N recharge complètement (c'est normal et attendu)

---

## 🔍 Vérifications dans la console

Ouvrez la console (F12) et vérifiez les logs :

### Première ouverture de la page N8N :
```
(Aucun log au début)
Retour sur l'onglet N8N - iframe préservée (après changement d'onglet)
```

### Changements d'onglet :
```
Retour sur l'onglet N8N - iframe préservée
Retour sur l'onglet N8N - iframe préservée
Retour sur l'onglet N8N - iframe préservée
```

### ❌ Logs à NE PAS voir :
```
Loading iframe... (signe de rechargement)
Iframe loaded (plusieurs fois)
Failed to load iframe (erreur)
```

---

## 🐛 Problèmes potentiels et solutions

### Problème 1 : L'iframe recharge toujours

**Symptômes :**
- L'iframe affiche un loader à chaque retour sur l'onglet
- La page se recharge complètement

**Solutions :**
1. Vérifiez que vous avez bien enregistré le fichier `page.tsx`
2. Redémarrez le serveur de développement :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Relancez
   npm run dev
   ```
3. Videz le cache du navigateur (Cmd+Shift+R ou Ctrl+Shift+R)
4. Vérifiez qu'il n'y a pas d'erreurs dans la console

### Problème 2 : Erreur "sandbox" dans la console

**Symptômes :**
```
TypeError: iframe.sandbox.add is not a function
```

**Solution :**
Le code utilise `sandbox.add()` mais cela devrait être une string. Modifiez la ligne 26 :

```typescript
// Ancienne version (ligne 26)
iframe.sandbox.add('allow-same-origin', 'allow-scripts', 'allow-forms', 'allow-popups', 'allow-popups-to-escape-sandbox')

// Nouvelle version
iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
```

### Problème 3 : L'iframe est vide ou n'affiche rien

**Symptômes :**
- La page N8N s'affiche mais l'iframe est vide
- Message d'erreur dans la console

**Solutions :**
1. Vérifiez que N8N est accessible à `https://n8n.talosprimes.com`
2. Vérifiez la configuration nginx (voir `CONFIGURER_N8N_IFRAME.md`)
3. Vérifiez les headers CORS dans la console Network (F12 > Network)
4. Testez directement `https://n8n.talosprimes.com` dans un nouvel onglet

### Problème 4 : L'iframe recharge après quelques minutes

**Symptômes :**
- Après 2-5 minutes en arrière-plan, l'iframe recharge

**Explication :**
- C'est le navigateur qui décharge l'iframe pour économiser la mémoire
- Comportement normal pour les onglets en arrière-plan

**Solutions :**
1. Utilisez la Solution 2 (stockage global) - voir documentation
2. Acceptez ce comportement (c'est une limitation du navigateur)
3. Utilisez une extension navigateur pour garder les onglets actifs

---

## 📊 Tableau de compatibilité navigateurs

| Navigateur | Version min | Changement onglet | Longue période | Notes |
|------------|-------------|-------------------|----------------|-------|
| **Chrome** | 90+ | ✅ | ✅ | Meilleure compatibilité |
| **Firefox** | 88+ | ✅ | ⚠️ | Peut décharger après 5min |
| **Safari** | 14+ | ✅ | ⚠️ | Plus agressif sur la mémoire |
| **Edge** | 90+ | ✅ | ✅ | Basé sur Chromium |
| **Brave** | 1.20+ | ✅ | ✅ | Basé sur Chromium |

**Légende :**
- ✅ : Fonctionne parfaitement
- ⚠️ : Fonctionne mais avec limitations
- ❌ : Ne fonctionne pas

---

## 🎯 Critères de réussite

Le test est réussi si :

1. ✅ L'iframe N8N ne recharge pas lors du changement d'onglet (moins de 2 minutes en arrière-plan)
2. ✅ L'état de travail est préservé (workflow ouvert, modifications non sauvegardées)
3. ✅ Pas de flash ou de rechargement visible
4. ✅ Les logs de console montrent `"Retour sur l'onglet N8N - iframe préservée"`
5. ✅ Pas d'erreurs JavaScript dans la console

---

## 📝 Rapport de test

Remplissez ce rapport après vos tests :

```
Date : _______________
Navigateur : _______________
Version : _______________

Test 1 (Changement onglet simple) : ⬜ Réussi ⬜ Échoué
Test 2 (Workflow ouvert) : ⬜ Réussi ⬜ Échoué
Test 3 (Changements multiples) : ⬜ Réussi ⬜ Échoué
Test 4 (Longue période) : ⬜ Réussi ⬜ Échoué
Test 5 (Navigation app) : ⬜ Réussi ⬜ Échoué
Test 6 (Rechargement page) : ⬜ Réussi ⬜ Échoué

Problèmes rencontrés :
_______________________________________
_______________________________________
_______________________________________

Notes supplémentaires :
_______________________________________
_______________________________________
_______________________________________
```

---

## 🚀 Prochaines étapes

Si tous les tests passent :
- ✅ La solution fonctionne !
- ✅ Vous pouvez commiter les changements
- ✅ Déployer en production si nécessaire

Si certains tests échouent :
- 📖 Consultez `FIX_N8N_RELOAD_ONGLET.md` pour les solutions alternatives
- 🐛 Vérifiez les problèmes potentiels ci-dessus
- 💬 Demandez de l'aide si nécessaire



