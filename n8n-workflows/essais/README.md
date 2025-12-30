# 🧪 Workflows - Gestion des Essais Gratuits

## Description
Workflows pour la gestion des essais gratuits (7-30 jours) offerts aux leads qualifiés.

---

## 📁 Workflows

### ✅ creer-essai.json
**Statut** : Production  
**Webhook** : `/webhook/creer-essai`  
**Déclencheur** : API création essai (bouton "Créer essai" dans `/platform/leads`)

**Actions** :
- 📧 Email identifiants complet au client
  - Email de connexion
  - Mot de passe temporaire
  - Lien de connexion
  - Date d'expiration
  - Liste des modules activés
- 📱 SMS confirmation essai activé

**API associée** : `/api/platform/trials/create`

**Données reçues** :
```json
{
  "email": "client@example.com",
  "first_name": "Sophie",
  "last_name": "MARTIN",
  "phone": "+33612345678",
  "company_name": "Test Company",
  "password": "Generated123!",
  "trial_end_date": "13 janvier 2026",
  "duration_days": 14,
  "enabled_modules": ["leads", "clients", "invoices"]
}
```

---

## 🔄 Cycle de Vie d'un Essai

```
Lead qualifié (interview_scheduled)
    ↓
Admin clique "Créer essai"
    ↓
API crée : auth.users + company + role + user + trial
    ↓
Workflow N8N : Email + SMS
    ↓
Client reçoit identifiants
    ↓
Client se connecte et teste (7-30 jours)
    ↓
Fin d'essai : Conversion ou Abandon
```

---

## ⚙️ Configuration Requise

### Credentials N8N
- **Resend API** : Pour l'email identifiants
- **Twilio API** : Pour le SMS

### Variables d'environnement
```env
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+33XXXXXXXXX
```

---

## 📧 Template Email Identifiants

L'email contient :
- 🎉 Message de bienvenue personnalisé
- 🔐 **Identifiants de connexion** :
  - Email
  - Mot de passe (en clair, à changer)
- 🚀 **Bouton de connexion** direct
- ⏰ **Date d'expiration** de l'essai
- 📦 **Liste des modules** activés
- 💡 **Conseils** pour bien démarrer
- 📞 **Support** : Email, téléphone, chat

---

## 🧪 Tests

### Tester creer-essai
```bash
curl -X POST https://n8n.talosprimes.com/webhook/creer-essai \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "ESSAI",
    "phone": "+33600000000",
    "company_name": "Test Co",
    "password": "TestPass123!",
    "trial_end_date": "15 janvier 2026",
    "duration_days": 14
  }'
```

**Résultat attendu** :
- 📧 Email identifiants complet reçu
- 📱 SMS confirmation reçu
- ✅ Client peut se connecter avec les identifiants

---

## 📊 Statuts des Essais

| Statut | Description | Action |
|--------|-------------|--------|
| `active` | Essai en cours | Client utilise l'app |
| `expired` | Essai expiré | Proposer abonnement |
| `converted` | Converti en client payant | Bravo ! 🎉 |
| `cancelled` | Essai annulé par le client | Demander feedback |

---

## 🔮 Workflows à Créer (Prochainement)

### rappel-fin-essai.json
- **Déclencheur** : Cron (3 jours avant expiration)
- **Action** : Email rappel + proposition commerciale

### fin-essai.json
- **Déclencheur** : Cron (tous les jours)
- **Action** : Désactiver essais expirés + Email fin essai

---

## 📊 Monitoring

**Vérifier dans Supabase** :
- Table `platform_trials` : Liste des essais
- Table `users` : Comptes créés
- Table `companies` : Entreprises créées

**Vérifier dans N8N** :
- Executions du workflow
- Taux de succès d'envoi email/SMS

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
- `/app/api/platform/trials/create/route.ts`

