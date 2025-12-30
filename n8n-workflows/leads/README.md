# 📊 Workflows - Gestion des Leads

## Description
Workflows pour la gestion du cycle de vie des leads, de la pré-inscription jusqu'à la conversion en clients.

---

## 📁 Workflows

### ✅ inscription-lead.json
**Statut** : Production  
**Webhook** : `/webhook/inscription-lead`  
**Déclencheur** : Formulaire public `/auth/register`

**Actions** :
- ✅ Création lead dans `platform_leads` (statut: `pre_registered`)
- 📧 Email de bienvenue au lead
- 📱 SMS au lead ("Nous vous contacterons sous 24h")
- 📱 SMS notification admin
- 🔔 Notification in-app admin

**API associée** : `/api/auth/register-lead`

---

### ✅ creation-lead-complet.json
**Statut** : Production  
**Webhook** : `/webhook/creation-lead-complet`  
**Déclencheur** : API de création de lead

**Actions** :
- ✅ Création lead avec toutes les données
- 📧 Email de confirmation

**API associée** : À définir

---

### ✅ leads-management.json
**Statut** : Production  
**Webhook** : `/webhook/leads-management`  
**Déclencheur** : Gestion des leads

**Actions** :
- 🔄 Gestion du cycle de vie des leads

**API associée** : À définir

---

## ⚙️ Configuration Requise

### Credentials N8N
- **Resend API** : Pour les emails
- **Twilio API** : Pour les SMS
- **Supabase Service Role Key** : Pour la base de données

### Variables d'environnement
```env
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+33XXXXXXXXX
```

---

## 🔄 Statuts des Leads

| Statut | Description | Étape |
|--------|-------------|-------|
| `pre_registered` | Lead vient de s'inscrire | Formulaire |
| `questionnaire_completed` | Questionnaire rempli | Qualification |
| `interview_scheduled` | Entretien planifié | Qualification |
| `trial_started` | Essai en cours | Essai |
| `converted` | Client actif | Conversion |
| `abandoned` | Lead abandonné | Fin |

---

## 🧪 Tests

### Tester inscription-lead
```bash
curl -X POST https://n8n.talosprimes.com/webhook/inscription-lead \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "LEAD",
    "email": "test@example.com",
    "phone": "+33600000000",
    "company_name": "Test Company",
    "lead_id": "test-123"
  }'
```

**Résultat attendu** :
- ✅ Lead créé dans `platform_leads`
- 📧 Email reçu à `test@example.com`
- 📱 SMS reçu au `+33600000000`
- 📱 SMS admin reçu

---

## 📊 Monitoring

**Dans N8N** :
1. Aller sur le workflow
2. Onglet "Executions" en bas
3. Vérifier les exécutions (vert = succès, rouge = erreur)

**Dans l'application** :
- Vérifier `platform_leads` dans Supabase
- Vérifier les logs VPS : `pm2 logs talosprime`

---

## 🔧 Maintenance

- **Responsable** : Admin plateforme
- **Dernière mise à jour** : 30/12/2025
- **Version** : 1.0.0

---

## 📚 Documentation

Voir aussi :
- `/docs/WORKFLOW_ONBOARDING_COMPLET.md`
- `/DEPLOIEMENT_ONBOARDING.md`

