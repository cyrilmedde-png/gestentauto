# 📱 SMS automatiques dans le workflow d'onboarding

## 📋 Vue d'ensemble

Les SMS sont automatiquement envoyés en complément des emails à chaque étape du workflow d'onboarding pour assurer un double rappel et une meilleure communication avec les prospects.

## 🔄 SMS envoyés automatiquement

### 1. Pré-inscription (`POST /api/platform/leads`)

**Quand :** Un nouveau lead est créé (formulaire de pré-inscription rempli)

**SMS envoyé :** `sendOnboardingConfirmationSMS()`

**Contenu :**
- Message de confirmation personnalisé
- Rappel que l'équipe va contacter

**Condition :** Uniquement si un numéro de téléphone est fourni (`lead.phone`)

---

### 2. Questionnaire complété (`POST /api/platform/leads/[id]/questionnaire`)

**Quand :** Un lead complète le questionnaire de besoins

**SMS envoyé :** `sendQuestionnaireReminderSMS()` (utilisé comme confirmation)

**Contenu :**
- Confirmation de complétion du questionnaire
- Lien vers le questionnaire (si fourni)

**Condition :** Uniquement si un numéro de téléphone est fourni

---

### 3. Entretien programmé (`POST /api/platform/leads/[id]/interview`)

**Quand :** Un entretien est programmé pour un lead

**SMS envoyé :** `sendInterviewConfirmationSMS()`

**Contenu :**
- Date et heure de l'entretien formatées
- Lien de réunion (si fourni)

**Condition :** Uniquement si un numéro de téléphone est fourni

---

### 4. Démarrage d'essai (`POST /api/platform/leads/[id]/trial`)

**Quand :** Un essai gratuit de 7 jours démarre pour un lead

**SMS envoyé :** `sendTrialStartSMS()`

**Contenu :**
- Identifiants de connexion (email + mot de passe temporaire)
- Rappel de changer le mot de passe

**Condition :** Uniquement si un numéro de téléphone est fourni

**⚠️ Note de sécurité :** Le mot de passe temporaire est inclus dans le SMS. C'est acceptable pour un essai, mais assurez-vous que les utilisateurs changent leur mot de passe rapidement.

---

## 🛡️ Gestion des erreurs

**Principe :** Les SMS ne doivent **jamais bloquer** le workflow d'onboarding.

### Implémentation

Tous les appels d'envoi de SMS sont encapsulés dans des `try/catch` :

```typescript
if (lead.phone) {
  try {
    await sendSMS(...)
  } catch (smsError) {
    console.error('Error sending SMS:', smsError)
    // On continue quand même, le SMS n'est pas critique
  }
}
```

### Logging

Les erreurs d'envoi de SMS sont loguées dans la console pour faciliter le débogage, mais n'interrompent pas le processus métier.

---

## 📝 Variables d'environnement nécessaires

Pour que les SMS fonctionnent, vous devez configurer :

```env
TWILIO_ACCOUNT_SID=ACvotre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678
```

---

## 🔍 Points d'intégration dans le code

### 1. Pré-inscription
**Fichier :** `app/api/platform/leads/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après envoi de l'email (ligne ~130)

### 2. Questionnaire complété
**Fichier :** `app/api/platform/leads/[id]/questionnaire/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après envoi de l'email (ligne ~200)

### 3. Entretien programmé
**Fichier :** `app/api/platform/leads/[id]/interview/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après envoi de l'email (ligne ~85)

### 4. Démarrage d'essai
**Fichier :** `app/api/platform/leads/[id]/trial/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après envoi de l'email (ligne ~430)

---

## 📊 Stratégie de double rappel

### Pourquoi Email + SMS ?

1. **Redondance** : Si l'email n'est pas lu, le SMS sert de rappel
2. **Rapidité** : Les SMS sont généralement lus plus rapidement
3. **Accessibilité** : Tous les utilisateurs ont un téléphone, même sans accès email
4. **Engagement** : Double canal = meilleur taux de réponse

### Conditions d'envoi

- **Email :** Toujours envoyé (si email fourni)
- **SMS :** Uniquement si `lead.phone` est présent

### Coûts

- **Email :** Gratuit (inclus dans Resend)
- **SMS :** ~0.05€ par SMS en France

---

## 🔒 Sécurité et bonnes pratiques

### Format des numéros

Les numéros doivent être au format international avec le préfixe `+` :
- ✅ `+33612345678` (France)
- ✅ `+32470123456` (Belgique)
- ❌ `0612345678` (ne fonctionnera pas)

### Données sensibles dans les SMS

⚠️ **Attention** : Les SMS contiennent parfois des informations sensibles (mots de passe temporaires). 

**Recommandations :**
1. Limiter les SMS aux informations essentielles
2. Rappeler de changer le mot de passe rapidement
3. Ne jamais envoyer de données très sensibles par SMS seul
4. Utiliser l'email comme canal principal pour les informations critiques

### Longueur des messages

- **Limite standard :** 160 caractères par SMS
- **Messages longs :** Automatiquement divisés en plusieurs SMS (coût multiplié)
- **Conseil :** Garder les messages SMS courts et concis

---

## 🧪 Tester les SMS

### Test manuel

1. **Test pré-inscription :**
   ```bash
   POST /api/platform/leads
   {
     "email": "test@example.com",
     "phone": "+33612345678",
     "first_name": "Test",
     "last_name": "User"
   }
   ```

2. **Test direct d'envoi de SMS :**
   ```bash
   GET /api/sms/test?to=+33612345678
   ```

### Vérification

- ✅ SMS reçu sur le téléphone
- ✅ Dashboard Twilio montre le SMS envoyé
- ✅ Logs de l'application sans erreur

---

## 📊 Monitoring

### Dashboard Twilio

Consultez le dashboard Twilio pour :
- Voir les SMS envoyés
- Vérifier les statuts (livré, échoué, etc.)
- Consulter les logs d'erreurs
- Gérer les numéros

**Lien :** [https://console.twilio.com](https://console.twilio.com)

### Logs applicatifs

Les erreurs d'envoi sont loguées dans la console de l'application avec :
- Le contexte (quelle étape du workflow)
- Le type d'erreur
- Les détails techniques

---

## 💰 Coûts et limites

### Tarification

- **France :** ~0.05€ par SMS
- **Belgique :** ~0.08€ par SMS
- **Suisse :** ~0.09€ par SMS

Voir les [tarifs complets Twilio](https://www.twilio.com/sms/pricing)

### Compte d'essai

- En compte d'essai Twilio, vous ne pouvez envoyer qu'aux numéros vérifiés
- Pour production, vérifiez votre compte et ajoutez un moyen de paiement

### Optimisation des coûts

- N'envoyez des SMS que si un numéro est fourni
- Privilégiez l'email comme canal principal
- Utilisez les SMS pour les rappels importants uniquement

---

## 🚀 Prochaines améliorations possibles

- [ ] Créer une table `sms_logs` pour tracer tous les SMS envoyés
- [ ] Ajouter des SMS de rappel automatiques (ex: 24h après questionnaire sans action)
- [ ] SMS de suivi post-essai (conversion, feedback, etc.)
- [ ] Gérer les cas d'erreur spécifiques (numéro invalide, compte suspendu, etc.)
- [ ] Templates SMS personnalisables
- [ ] Support multilingue (FR, EN, etc.)
- [ ] Opt-out pour les SMS (RGPD)

