# 📱 Intégration Twilio - Service d'envoi de SMS

## 📋 Vue d'ensemble

L'intégration Twilio permet d'envoyer des SMS transactionnels depuis l'application TalosPrime.

## 🔧 Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` (développement) ou `.env.production` (production) :

```env
# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACvotre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678
```

### Où trouver vos identifiants Twilio ?

1. Connectez-vous sur [https://console.twilio.com](https://console.twilio.com)
2. Allez dans **Settings** → **General**
3. Vous trouverez :
   - **Account SID** → `TWILIO_ACCOUNT_SID` (commence par `AC`)
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
4. Pour le numéro d'envoi, allez dans **Phone Numbers** → **Manage** → **Buy a number** (ou utilisez un numéro existant)
   - Le numéro au format international → `TWILIO_PHONE_NUMBER` (ex: `+33612345678`)

### Numéro d'envoi

⚠️ **Important** : Vous devez avoir un numéro Twilio vérifié pour envoyer des SMS.

- **Numéro payant** : Achetez un numéro dans Twilio (quelques euros/mois)
- **Numéro d'essai** : En compte d'essai, vous ne pouvez envoyer qu'aux numéros vérifiés dans votre compte

## 📚 Utilisation

### Service principal : `lib/services/sms.ts`

#### Fonction générique : `sendSMS()`

```typescript
import { sendSMS } from '@/lib/services/sms'

const result = await sendSMS({
  to: '+33612345678', // Format international obligatoire
  message: 'Votre message SMS ici',
  from: '+33698765432', // Optionnel, utilise TWILIO_PHONE_NUMBER par défaut
})

if (result.success) {
  console.log('SMS envoyé avec succès:', result.messageId)
} else {
  console.error('Erreur:', result.error)
}
```

#### Fonctions spécialisées

**SMS de confirmation d'onboarding :**
```typescript
import { sendOnboardingConfirmationSMS } from '@/lib/services/sms'

await sendOnboardingConfirmationSMS('+33612345678', 'Nom du prospect')
```

**Rappel questionnaire :**
```typescript
import { sendQuestionnaireReminderSMS } from '@/lib/services/sms'

await sendQuestionnaireReminderSMS(
  '+33612345678',
  'Nom du prospect',
  'https://talosprime.fr/questionnaire/123' // Lien optionnel
)
```

**Confirmation d'entretien :**
```typescript
import { sendInterviewConfirmationSMS } from '@/lib/services/sms'

await sendInterviewConfirmationSMS(
  '+33612345678',
  'Nom du prospect',
  new Date('2024-01-15T14:00:00'), // Date de l'entretien
  'https://meet.google.com/xxx' // Lien de réunion optionnel
)
```

**Démarrage d'essai :**
```typescript
import { sendTrialStartSMS } from '@/lib/services/sms'

await sendTrialStartSMS(
  '+33612345678',
  'Nom du prospect',
  'user@example.com', // Email
  'TempPassword123!' // Mot de passe temporaire
)
```

## 🔌 API Routes

### POST `/api/sms/send`

Envoie un SMS générique.

**Requête :**
```json
{
  "to": "+33612345678",
  "message": "Votre message SMS",
  "from": "+33698765432"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "messageId": "SM1234567890abcdef"
}
```

**Réponse (erreur) :**
```json
{
  "error": "Message d'erreur"
}
```

### GET `/api/sms/test?to=+33612345678`

Envoie un SMS de test pour vérifier la configuration.

**Exemple :**
```bash
curl "http://localhost:3000/api/sms/test?to=+33612345678"
```

## 🔄 Format des numéros

⚠️ **Important** : Les numéros doivent être au format international avec le préfixe `+`.

**Formats acceptés :**
- ✅ `+33612345678` (format international avec +)
- ✅ `33612345678` (sera automatiquement préfixé avec +)
- ❌ `0612345678` (ne fonctionnera pas, manque le code pays)

**Exemples :**
- France : `+33612345678` ou `+33123456789`
- Belgique : `+32470123456`
- Suisse : `+41791234567`

## 🔄 Intégration dans le workflow d'onboarding

### Exemple : Envoi SMS après pré-inscription

```typescript
// Dans app/api/platform/leads/route.ts (POST)
import { sendOnboardingConfirmationSMS } from '@/lib/services/sms'

// Après création du lead
if (leadCreated && lead.phone) {
  await sendOnboardingConfirmationSMS(
    lead.phone,
    `${lead.first_name} ${lead.last_name}`
  )
}
```

### Exemple : SMS + Email combinés

```typescript
// Envoyer email ET SMS
await Promise.all([
  sendOnboardingConfirmationEmail(lead.email, leadName),
  lead.phone ? sendOnboardingConfirmationSMS(lead.phone, leadName) : Promise.resolve({ success: true }),
])
```

## 🧪 Tests

### Test local

1. Configurez vos variables d'environnement
2. Démarrez le serveur de développement : `npm run dev`
3. Visitez : `http://localhost:3000/api/sms/test?to=+VOTRE_NUMERO`
4. Vérifiez votre téléphone

### Test depuis le code

```typescript
import { sendSMS } from '@/lib/services/sms'

// Dans un composant serveur ou API route
const result = await sendSMS({
  to: '+33612345678',
  message: 'Test SMS depuis TalosPrime',
})

console.log(result)
```

## ⚠️ Gestion des erreurs

Le service gère automatiquement :

- ✅ Identifiants manquants (retourne une erreur explicite)
- ✅ Numéro invalide (Twilio retourne une erreur)
- ✅ Erreurs Twilio (logguées dans la console)
- ✅ Exceptions non gérées (catch général)

**Exemple de gestion d'erreur :**

```typescript
const result = await sendSMS(options)

if (!result.success) {
  // Loguer l'erreur
  console.error('Échec envoi SMS:', result.error)
  
  // Optionnel : enregistrer dans une table de logs
  // ou envoyer une notification d'erreur
}
```

## 💰 Coûts

### Tarification Twilio

- **Prix par SMS** : Variable selon le pays (voir [Tarifs Twilio](https://www.twilio.com/sms/pricing))
- **France** : ~0.05€ par SMS
- **Numéro français** : ~1€/mois

### Limites en compte d'essai

- En compte d'essai, vous ne pouvez envoyer qu'aux numéros vérifiés
- Pour production, vous devrez vérifier votre compte et ajouter un moyen de paiement

## 📊 Monitoring

Twilio fournit un dashboard pour :

- Voir les SMS envoyés
- Vérifier les taux de livraison
- Consulter les logs d'erreurs
- Gérer les numéros

Accédez au dashboard : [https://console.twilio.com](https://console.twilio.com)

## 🔒 Sécurité

- ✅ Identifiants stockés uniquement dans les variables d'environnement
- ✅ Identifiants jamais exposés côté client
- ✅ Validation du format des numéros
- ✅ Gestion sécurisée des erreurs

## 📝 Notes importantes

1. **Format international** : Toujours utiliser le format international (`+33...`)
2. **Coûts** : Chaque SMS a un coût, soyez attentif à l'usage
3. **Compte d'essai** : Limité aux numéros vérifiés
4. **Logs** : Les erreurs sont logguées dans la console. Pour production, considérez un service de logging centralisé
5. **Longueur** : Un SMS standard fait 160 caractères. Les messages plus longs sont divisés en plusieurs SMS (coût multiplié)

## 🚀 Prochaines étapes

- [ ] Intégrer les SMS dans le workflow d'onboarding automatique
- [ ] Créer un système de logs de SMS dans la base de données
- [ ] Ajouter des webhooks Twilio pour le suivi des statuts (livré, échoué, etc.)
- [ ] Implémenter un système de templates SMS réutilisables
- [ ] Gérer les cas d'erreur spécifiques (numéro invalide, compte suspendu, etc.)







