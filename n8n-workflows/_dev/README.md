# 🛠️ Workflows - Développement & Tests

## ⚠️ Important
**Ces workflows sont pour le DÉVELOPPEMENT uniquement.**  
**Ne PAS les activer en production !**

---

## Description
Workflows de test et exemples pour le développement de nouvelles fonctionnalités.

**Workflow de travail** :
1. 🧪 Développer et tester dans `_dev/`
2. ✅ Valider le fonctionnement complet
3. 📦 Copier vers le dossier de production approprié
4. ✏️ Renommer (retirer `-example` ou `-test`)
5. 🚀 Activer en production

---

## 📁 Workflows

### 🧪 register-module-example.json
**Statut** : Exemple / Dev only  
**Webhook** : `/webhook/register-module`

**Rôle** :
- Exemple d'enregistrement automatique de module
- Test de l'API `/api/platform/n8n/modules/register`

**Utilisation** :
1. Importer dans N8N
2. Activer le workflow
3. Tester avec :
```bash
curl -X POST https://n8n.talosprimes.com/webhook/register-module \
  -H "Content-Type: application/json"
```

**Ce qu'il fait** :
- Prépare les données d'un module
- Appelle l'API d'enregistrement
- Retourne succès ou erreur

**Quand l'utiliser** :
- Pour tester la création de modules dynamiques
- Pour comprendre comment enregistrer un workflow comme module
- Pour débugger l'API de modules

---

## 🧪 Workflows à Créer (Suggestions)

### test-email.json
**Rôle** : Tester l'envoi d'emails via Resend
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello"}'
```

### test-sms.json
**Rôle** : Tester l'envoi de SMS via Twilio
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+33600000000","message":"Test SMS"}'
```

### test-stripe.json
**Rôle** : Tester les appels à l'API Stripe
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-stripe \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"test@example.com","amount":1999}'
```

### test-notification.json
**Rôle** : Tester les notifications in-app
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-notification \
  -H "Content-Type: application/json" \
  -d '{"type":"test","title":"Test","message":"Ceci est un test"}'
```

---

## 🎯 Bonnes Pratiques

### Nommage
- ✅ Préfixe `test-` ou suffixe `-example`
- ✅ Nom explicite : `test-email.json`, `webhook-stripe-example.json`
- ❌ Éviter : `workflow1.json`, `test.json`

### Configuration
- ✅ Utiliser des credentials de **test** / **sandbox**
- ✅ Utiliser des emails/téléphones de test
- ❌ **Jamais** utiliser les credentials de production
- ❌ **Jamais** envoyer à de vrais clients

### Documentation
- ✅ Commenter chaque nœud dans N8N
- ✅ Documenter les paramètres dans le README
- ✅ Fournir des exemples de `curl` pour tester

---

## 🧪 Environnement de Test

### Emails de Test
- `test@example.com`
- `dev@talosprimes.com`
- Votre email personnel

### Téléphones de Test
- `+33600000000` (factice)
- Votre téléphone personnel (attention aux coûts SMS)

### Credentials
- **Resend** : Clé API test
- **Twilio** : Account SID test / Auth Token test
- **Stripe** : Clés test (pk_test_...)

---

## 🚀 Passage en Production

### Checklist avant de passer un workflow en production :

- [ ] ✅ Tests complets effectués
- [ ] ✅ Fonctionne avec des données réelles (en test)
- [ ] ✅ Gestion d'erreurs implémentée
- [ ] ✅ Logs clairs pour le debugging
- [ ] ✅ Credentials de production configurées
- [ ] ✅ Documentation à jour
- [ ] ✅ README créé dans le dossier de destination
- [ ] ✅ Renommé sans suffixe `-example` ou `-test`
- [ ] ✅ Workflow copié dans le bon dossier (`leads/`, `essais/`, etc.)
- [ ] ✅ Activé dans N8N (bouton vert)

---

## 🔧 Debugging

### Logs N8N
1. Ouvrir le workflow dans N8N
2. Onglet "Executions" en bas
3. Cliquer sur une exécution pour voir les détails
4. Vérifier chaque nœud (vert = OK, rouge = erreur)

### Logs Application
```bash
# Sur le VPS
ssh root@votre-serveur.com
pm2 logs talosprime --lines 100
```

### Tester les Webhooks
```bash
# Test simple
curl -X POST https://n8n.talosprimes.com/webhook/VOTRE_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test avec verbose
curl -v -X POST https://n8n.talosprimes.com/webhook/VOTRE_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📚 Ressources

- [Documentation N8N](https://docs.n8n.io/)
- [Documentation Resend](https://resend.com/docs)
- [Documentation Twilio](https://www.twilio.com/docs)
- [Documentation Stripe](https://stripe.com/docs)

---

## 🔧 Maintenance

- **Responsable** : Développeurs
- **Dernière mise à jour** : 30/12/2025
- **Version** : 1.0.0

---

**Rappel** : Ces workflows sont pour le développement. Ne jamais les utiliser en production ! 🚨

