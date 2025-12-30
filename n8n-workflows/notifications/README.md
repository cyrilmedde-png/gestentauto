# 🔔 Workflows - Notifications

## Description
Workflows pour les notifications automatiques (emails, SMS, in-app) à destination des clients et des admins.

---

## 📁 Workflows (À créer)

### 🔮 notification-admin-lead.json
**Statut** : ✅ Intégré dans `leads/inscription-lead.json`  
**Note** : Déjà fonctionnel

---

### 🔮 notification-fin-essai-proche.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 9h)

**Actions prévues** :
- 🔍 Rechercher essais se terminant dans 3 jours
- 📧 Email rappel fin essai + offre commerciale
- 📱 SMS rappel
- 🔔 Notification in-app

---

### 🔮 notification-bienvenue-client.json
**Statut** : À développer  
**Déclencheur** : Nouveau client (abonnement créé)

**Actions prévues** :
- 📧 Email bienvenue complet
  - Guide de démarrage
  - Liens ressources
  - Contact support
- 📱 SMS bienvenue
- 🔔 Notification in-app

---

### 🔮 notification-onboarding.json
**Statut** : À développer  
**Déclencheur** : Cron (J+1, J+3, J+7 après inscription)

**Actions prévues** :
- 📧 Séquence d'emails onboarding
  - J+1 : Comment créer votre premier lead
  - J+3 : Gérer vos clients efficacement
  - J+7 : Facturation et devis
- 🔔 Notifications in-app progressives

---

### 🔮 notification-inactivite.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours)

**Actions prévues** :
- 🔍 Rechercher clients inactifs (>7 jours sans connexion)
- 📧 Email "On vous a manqué ?"
- 📊 Proposer aide / formation

---

### 🔮 notification-nouveaute.json
**Statut** : À développer  
**Déclencheur** : Manuel (admin)

**Actions prévues** :
- 📧 Email nouveauté à tous les clients actifs
- 🎉 Annonce nouvelle fonctionnalité
- 🔔 Notification in-app

---

### 🔮 notification-maintenance.json
**Statut** : À développer  
**Déclencheur** : Manuel (avant maintenance)

**Actions prévues** :
- 📧 Email alerte maintenance programmée
- 📱 SMS (si maintenance > 1h)
- 🔔 Notification in-app
- ⏰ Rappel 1h avant

---

### 🔮 notification-probleme-technique.json
**Statut** : À développer  
**Déclencheur** : Monitoring (erreur détectée)

**Actions prévues** :
- 📱 SMS alerte admin
- 📧 Email détails technique
- 🔔 Notification in-app admin
- 📊 Log dans système de suivi

---

## 📧 Types de Notifications

### Emails Transactionnels
- ✅ Confirmation inscription
- ✅ Identifiants essai
- 💳 Confirmation abonnement
- 📄 Reçu de paiement
- ❌ Échec paiement
- 🔒 Réinitialisation mot de passe

### Emails Marketing
- 🎉 Bienvenue
- 📚 Onboarding (séquence)
- 🆕 Nouveautés
- 💡 Conseils & astuces
- 📊 Récapitulatif mensuel

### SMS
- ✅ Confirmation actions importantes
- ❌ Alertes critiques (paiement, sécurité)
- 📱 Codes de vérification 2FA (futur)

### Notifications In-App
- 🔔 Nouveau lead
- ✅ Action requise
- 📊 Statistiques
- 💬 Messages support

---

## ⚙️ Configuration Requise

### Credentials N8N
- **Resend API** : Pour les emails
- **Twilio API** : Pour les SMS
- **Supabase** : Pour les notifications in-app

### Variables d'environnement
```env
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+33XXXXXXXXX
```

---

## 📊 Suivi des Notifications

### Métriques à Tracker
- 📧 Taux d'ouverture emails
- 🔗 Taux de clic emails
- 📱 Taux de délivrance SMS
- 🔔 Taux de lecture notifications in-app
- ❌ Taux de désabonnement

### Outils
- **Resend Dashboard** : Statistiques emails
- **Twilio Console** : Statistiques SMS
- **Supabase** : Table `notifications` pour in-app

---

## 🎨 Templates d'Emails

### Structure Standard
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- En-tête avec logo -->
  <div style="background: #2563eb; padding: 20px; text-align: center;">
    <h1 style="color: white;">Talos Prime</h1>
  </div>
  
  <!-- Contenu -->
  <div style="padding: 30px; background: white;">
    <!-- Message personnalisé -->
  </div>
  
  <!-- Pied de page -->
  <div style="padding: 20px; background: #f5f5f5; text-align: center;">
    <p style="color: #666;">© 2025 Talos Prime</p>
    <a href="#">Se désabonner</a>
  </div>
</body>
</html>
```

---

## 🚫 Gestion des Désabonnements

### Préférences Utilisateur
- ✅ Emails transactionnels (obligatoires)
- ⚙️ Emails onboarding (optionnels)
- 📰 Newsletters (optionnels)
- 🎉 Nouveautés (optionnels)

### Table `notification_preferences`
```sql
CREATE TABLE notification_preferences (
  user_id uuid REFERENCES users(id),
  email_transactional boolean DEFAULT true,
  email_marketing boolean DEFAULT true,
  email_newsletters boolean DEFAULT true,
  sms_alerts boolean DEFAULT true,
  in_app boolean DEFAULT true
);
```

---

## 🧪 Tests

### Tester un Email
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "votre@email.com",
    "subject": "Test Email",
    "template": "bienvenue",
    "data": {
      "first_name": "Test",
      "last_name": "USER"
    }
  }'
```

### Tester un SMS
```bash
curl -X POST https://n8n.talosprimes.com/webhook/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33600000000",
    "message": "Test SMS"
  }'
```

---

## 📊 Monitoring

### Alertes à Configurer
- 📧 Taux d'erreur emails > 5%
- 📱 Taux d'erreur SMS > 5%
- ⏱️ Délai envoi > 5 minutes
- 💰 Coûts SMS > budget mensuel

---

## 🔧 Maintenance

- **Responsable** : Admin plateforme
- **Statut** : 🔮 Planifié
- **Priorité** : Moyenne
- **Date début prévue** : Après système abonnements

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Templates Emails Resend](https://resend.com/docs/send-with-react)
- [Documentation Twilio](https://www.twilio.com/docs)
- [Bonnes pratiques Email Marketing](https://sendgrid.com/blog/email-marketing-best-practices/)

