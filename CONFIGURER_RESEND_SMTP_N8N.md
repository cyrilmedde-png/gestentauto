# 📧 CONFIGURER RESEND SMTP DANS N8N

**Objectif** : Activer le node Email pour recevoir les notifications

---

## 🎯 ÉTAPE 1 : OBTENIR UNE CLÉ API RESEND (3 MINUTES)

### 1.1 Créer un Compte Resend (Si Pas Déjà Fait)

```
https://resend.com/signup
```

**Remplir** :
- Email
- Mot de passe
- Nom de l'entreprise : Talos Prime

**Gratuit** : 100 emails/jour gratuits, parfait pour commencer !

### 1.2 Vérifier le Domaine (Optionnel mais Recommandé)

```
1. Dashboard Resend → Domains
2. Add Domain → talosprimes.com
3. Ajouter les enregistrements DNS (TXT, MX, CNAME)
```

**Vous pouvez sauter cette étape** et utiliser le domaine par défaut de Resend pour tester.

### 1.3 Créer une Clé API

```
1. Dashboard Resend → API Keys
2. Cliquer "Create API Key"
3. Name: "N8N Notifications"
4. Permission: "Sending access"
5. Cliquer "Create"
6. ⚠️ COPIER LA CLÉ (vous ne la reverrez plus !)
```

**Format de la clé** : `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**⚠️ IMPORTANT** : Copiez-la dans un fichier temporaire, vous en aurez besoin !

---

## 🔧 ÉTAPE 2 : CONFIGURER SMTP DANS N8N (2 MINUTES)

### 2.1 Ouvrir N8N

```
https://n8n.talosprimes.com
Workflow: "Gestion Plans - Notifications"
```

### 2.2 Réactiver le Node Email (Si Désactivé)

```
1. Cliquer sur le node "Email Admin"
2. S'il est grisé (Deactivated) :
   - Cliquer sur les 3 points (...)
   - Cliquer "Activate"
3. Le node redevient normal (icône 📧 en couleur)
```

### 2.3 Configurer les Credentials

```
1. Avec le node "Email Admin" sélectionné
2. Dans le panneau de droite, trouver "Credentials"
3. Cliquer sur "Select Credential"
4. Si "Resend SMTP" existe → Le sélectionner (ÉTAPE 2.5)
5. Si non → Cliquer "Create New Credential"
```

### 2.4 Créer le Credential SMTP

**Paramètres à remplir** :

```
Credential Type: SMTP
Credential Name: Resend SMTP

Configuration:
├── Host: smtp.resend.com
├── Port: 465
├── Security: SSL/TLS (activé)
├── User: resend
└── Password: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              (votre clé API Resend copiée à l'ÉTAPE 1.3)
```

**Paramètres détaillés** :

| Champ | Valeur | Note |
|-------|--------|------|
| **Host** | `smtp.resend.com` | Serveur SMTP Resend |
| **Port** | `465` | Port SSL/TLS |
| **Security** | `SSL/TLS` | Activé (toggle ON) |
| **Username** | `resend` | Toujours "resend" |
| **Password** | `re_xxxxxxxx...` | Votre clé API |
| **Sender Name** | `Talos Prime` | (optionnel) |
| **Sender Email** | `notifications@talosprimes.com` | (optionnel) |

### 2.5 Sauvegarder le Credential

```
Cliquer "Save" ou "Create"
```

N8N va tester la connexion.

**✅ Résultat attendu** : "Credential saved successfully"

**❌ Si erreur** : Vérifier que la clé API est correcte (commence bien par `re_`)

---

## 📝 ÉTAPE 3 : CONFIGURER L'EMAIL

### 3.1 Paramètres du Node Email

Avec le node "Email Admin" toujours sélectionné :

```
From Email: notifications@talosprimes.com
            (ou votre domaine vérifié)

To Email: votre-email@gmail.com
          (pour recevoir les notifications)

Subject: 🎛️ Plan Modifié: {{ $json.planName }}

Text: 
Plan: {{ $json.planName }}
Modifié par: {{ $json.modifiedBy }}
Date: {{ $json.modifiedAt }}

Modifications:
{{ JSON.stringify($json.changes, null, 2) }}
```

**Note** : `{{ $json.xxx }}` sont des variables N8N qui seront remplacées automatiquement.

### 3.2 Email HTML (Optionnel - Plus Joli)

Si vous voulez un email HTML au lieu de texte brut :

```
1. Dans le node Email Admin
2. Changer "Email Format" de "Text" à "HTML"
3. Message HTML:

<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #667eea; color: white; padding: 20px; }
    .content { padding: 20px; }
    .changes { background: #f5f5f5; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>🎛️ Plan Modifié</h2>
  </div>
  <div class="content">
    <p><strong>Plan:</strong> {{ $json.planName }}</p>
    <p><strong>Modifié par:</strong> {{ $json.modifiedBy }}</p>
    <p><strong>Date:</strong> {{ $json.modifiedAt }}</p>
    
    <h3>Modifications:</h3>
    <div class="changes">
      <pre>{{ JSON.stringify($json.changes, null, 2) }}</pre>
    </div>
  </div>
</body>
</html>
```

---

## 💾 ÉTAPE 4 : SAUVEGARDER ET TESTER

### 4.1 Sauvegarder le Workflow

```
1. Cliquer "Save" (en haut à droite)
2. Désactiver le toggle (Active → Inactive)
3. Réactiver le toggle (Inactive → Active)
```

**Pourquoi ?** Pour que N8N recharge le workflow avec les nouveaux credentials.

### 4.2 Test Manuel dans N8N

```
1. Cliquer sur "Execute workflow" (en bas)
2. N8N va simuler une exécution
3. Vérifier que chaque node s'exécute sans erreur ✅
4. Vérifier votre boîte email → Vous devriez avoir reçu un email de test
```

### 4.3 Test via Curl

```bash
curl -X POST https://n8n.talosprimes.com/webhook/plan-modified \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "plan_updated",
    "planId": "test-123",
    "planName": "Plan Test",
    "modifiedBy": "admin@test.com",
    "modifiedAt": "2025-12-31T12:00:00Z",
    "changes": {
      "price_monthly": {
        "old": 29,
        "new": 39
      },
      "max_users": {
        "old": 1,
        "new": 10
      }
    }
  }'
```

**✅ Résultat attendu** :
```json
{"headers": {...}, "body": {...}}
```

**Et dans votre boîte email** : Un email avec les détails de la modification !

### 4.4 Test depuis l'Application

```
1. https://www.talosprimes.com/platform/plans
2. Modifier "Starter" : Max Users → 20
3. Sauvegarder
4. Vérifier les logs VPS:
   pm2 logs talosprime --lines 20
5. Vérifier votre email → Vous devriez avoir reçu l'email !
```

---

## 🐛 DÉPANNAGE

### Erreur: "Authentication failed"

**Cause** : Clé API incorrecte

**Solution** :
```
1. Vérifier la clé API dans Resend Dashboard
2. Créer une nouvelle clé si nécessaire
3. Mettre à jour le credential dans N8N
```

### Erreur: "Could not connect to SMTP server"

**Cause** : Port ou Host incorrect

**Solution** :
```
Vérifier:
- Host: smtp.resend.com
- Port: 465
- Security: SSL/TLS activé
```

### Email n'arrive pas

**Causes possibles** :
1. **Email dans spam** → Vérifier le dossier spam
2. **Domaine non vérifié** → Utiliser un email avec domaine vérifié dans Resend
3. **Limite gratuite atteinte** → Vérifier dans Resend Dashboard

**Solution** :
```
1. Resend Dashboard → Logs
2. Voir si l'email a été envoyé
3. Vérifier le statut (delivered, bounced, etc.)
```

---

## ✅ VALIDATION FINALE

### Check-list

- [ ] Compte Resend créé
- [ ] Clé API Resend générée
- [ ] Credential SMTP créé dans N8N
- [ ] Node Email réactivé
- [ ] Workflow sauvegardé
- [ ] Toggle OFF → ON
- [ ] Test "Execute workflow" → ✅
- [ ] Test curl → Email reçu
- [ ] Test depuis app → Email reçu

---

## 🎯 APRÈS CONFIGURATION

**Une fois que les emails fonctionnent** :

```
✅ Modification plan → Email admin
✅ Toggle plan → Email admin
✅ Historique en BDD
✅ Logs détaillés
✅ Notifications temps réel
```

**Prêt pour** : ÉTAPE 2 - Webhooks Stripe (30 min)

---

## 📊 INFOS RESEND

### Plan Gratuit
- ✅ 100 emails/jour
- ✅ 3,000 emails/mois
- ✅ Parfait pour commencer

### Plan Payant (si nécessaire plus tard)
- $20/mois pour 50,000 emails
- Domaines personnalisés illimités

### Dashboard Resend
```
https://resend.com/dashboard

Sections utiles:
- Logs: Voir tous les emails envoyés
- Analytics: Statistiques d'envoi
- Domains: Gérer vos domaines
- API Keys: Gérer vos clés
```

---

## 🔐 SÉCURITÉ

**⚠️ IMPORTANT** :

1. **NE JAMAIS** committer la clé API dans Git
2. La clé API donne accès à l'envoi d'emails depuis votre compte
3. Si compromise → Révoquer et recréer dans Resend Dashboard
4. Utiliser des clés différentes pour dev/prod si possible

---

**⏱️ TEMPS TOTAL : 5-10 MINUTES**

**🎯 COMMENCEZ PAR CRÉER LE COMPTE RESEND !**

**💬 DITES-MOI UNE FOIS QUE VOUS AVEZ LA CLÉ API !**

