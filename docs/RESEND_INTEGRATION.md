# 📧 Intégration Resend - Service d'envoi d'emails

## 📋 Vue d'ensemble

L'intégration Resend permet d'envoyer des emails transactionnels et marketing depuis l'application TalosPrime.

## 🔧 Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` (développement) ou `.env.production` (production) :

```env
# Resend (Email)
RESEND_API_KEY=re_votre_cle_api_resend
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime
```

### Où trouver votre clé API Resend ?

1. Connectez-vous sur [https://resend.com](https://resend.com)
2. Allez dans **API Keys**
3. Créez une nouvelle clé API ou utilisez une clé existante
4. Copiez la clé (elle commence par `re_`)

### Domaines vérifiés

⚠️ **Important** : Pour envoyer des emails depuis un domaine personnalisé (ex: `noreply@talosprime.fr`), vous devez :

1. Ajouter votre domaine dans Resend
2. Configurer les enregistrements DNS (SPF, DKIM, DMARC)
3. Vérifier le domaine

En développement, vous pouvez utiliser le domaine par défaut de Resend : `onboarding@resend.dev`

## 📚 Utilisation

### Service principal : `lib/services/email.ts`

#### Fonction générique : `sendEmail()`

```typescript
import { sendEmail } from '@/lib/services/email'

const result = await sendEmail({
  to: 'client@example.com',
  subject: 'Sujet de l\'email',
  html: '<h1>Contenu HTML</h1>',
  text: 'Contenu texte alternatif',
  from: 'TalosPrime <noreply@talosprime.fr>', // Optionnel
  replyTo: 'support@talosprime.fr', // Optionnel
})

if (result.success) {
  console.log('Email envoyé avec succès:', result.messageId)
} else {
  console.error('Erreur:', result.error)
}
```

#### Fonctions spécialisées

**Email de bienvenue :**
```typescript
import { sendWelcomeEmail } from '@/lib/services/email'

await sendWelcomeEmail('user@example.com', 'Nom du client')
```

**Confirmation d'onboarding :**
```typescript
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'

await sendOnboardingConfirmationEmail('lead@example.com', 'Nom du prospect')
```

**Rappel questionnaire :**
```typescript
import { sendQuestionnaireReminderEmail } from '@/lib/services/email'

await sendQuestionnaireReminderEmail(
  'lead@example.com',
  'Nom du prospect',
  'https://talosprime.fr/questionnaire/123' // Lien optionnel
)
```

**Confirmation d'entretien :**
```typescript
import { sendInterviewConfirmationEmail } from '@/lib/services/email'

await sendInterviewConfirmationEmail(
  'lead@example.com',
  'Nom du prospect',
  new Date('2024-01-15T14:00:00'), // Date de l'entretien
  'https://meet.google.com/xxx' // Lien de réunion optionnel
)
```

## 🔌 API Routes

### POST `/api/email/send`

Envoie un email générique.

**Requête :**
```json
{
  "to": "client@example.com",
  "subject": "Sujet de l'email",
  "html": "<h1>Contenu HTML</h1>",
  "text": "Contenu texte alternatif",
  "from": "TalosPrime <noreply@talosprime.fr>",
  "replyTo": "support@talosprime.fr"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "messageId": "abc123"
}
```

**Réponse (erreur) :**
```json
{
  "error": "Message d'erreur"
}
```

### GET `/api/email/test?to=test@example.com`

Envoie un email de test pour vérifier la configuration.

**Exemple :**
```bash
curl "http://localhost:3000/api/email/test?to=test@example.com"
```

## 🎨 Templates d'emails

Les templates sont intégrés dans le code avec un style cohérent :

- **Couleurs** : Fond sombre (#080808) pour les en-têtes, fond clair (#f9f9f9) pour le contenu
- **Style** : Simple, professionnel, responsive
- **Format** : HTML avec alternative texte

### Personnalisation des templates

Les templates sont définis dans `lib/services/email.ts`. Vous pouvez :

1. Modifier les styles CSS dans les templates
2. Ajouter de nouveaux templates en créant de nouvelles fonctions
3. Externaliser les templates dans des fichiers séparés si nécessaire

## 🔄 Intégration dans le workflow d'onboarding

### Exemple : Envoi automatique après pré-inscription

```typescript
// Dans app/api/platform/leads/route.ts (POST)
import { sendOnboardingConfirmationEmail } from '@/lib/services/email'

// Après création du lead
if (leadCreated) {
  await sendOnboardingConfirmationEmail(
    lead.email,
    `${lead.first_name} ${lead.last_name}`
  )
}
```

### Exemple : Rappel automatique du questionnaire

```typescript
// Dans un job/scheduler (Inngest, cron, etc.)
import { sendQuestionnaireReminderEmail } from '@/lib/services/email'

// Pour tous les leads sans questionnaire après 24h
const leadsWithoutQuestionnaire = await getLeadsWithoutQuestionnaire()

for (const lead of leadsWithoutQuestionnaire) {
  await sendQuestionnaireReminderEmail(
    lead.email,
    `${lead.first_name} ${lead.last_name}`,
    `https://talosprime.fr/platform/leads/${lead.id}/questionnaire`
  )
}
```

## 🧪 Tests

### Test local

1. Configurez vos variables d'environnement
2. Démarrez le serveur de développement : `npm run dev`
3. Visitez : `http://localhost:3000/api/email/test?to=votre-email@example.com`
4. Vérifiez votre boîte mail

### Test depuis le code

```typescript
import { sendEmail } from '@/lib/services/email'

// Dans un composant serveur ou API route
const result = await sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
})

console.log(result)
```

## ⚠️ Gestion des erreurs

Le service gère automatiquement :

- ✅ Clé API manquante (retourne une erreur explicite)
- ✅ Erreurs Resend (logguées dans la console)
- ✅ Exceptions non gérées (catch général)

**Exemple de gestion d'erreur :**

```typescript
const result = await sendEmail(options)

if (!result.success) {
  // Loguer l'erreur
  console.error('Échec envoi email:', result.error)
  
  // Optionnel : envoyer une notification d'erreur
  // ou enregistrer dans une table de logs
}
```

## 📊 Monitoring

Resend fournit un dashboard pour :

- Voir les emails envoyés
- Vérifier les taux de livraison
- Consulter les logs d'erreurs
- Gérer les domaines vérifiés

Accédez au dashboard : [https://resend.com/emails](https://resend.com/emails)

## 🔒 Sécurité

- ✅ Clé API stockée uniquement dans les variables d'environnement
- ✅ Clé API jamais exposée côté client
- ✅ Validation des entrées avant envoi
- ✅ Protection contre l'injection HTML (utiliser des templates sécurisés)

## 📝 Notes importantes

1. **Rate limits** : Resend a des limites de taux. Vérifiez votre plan sur [resend.com/pricing](https://resend.com/pricing)
2. **Domaines vérifiés** : Pour production, utilisez toujours un domaine vérifié
3. **Spam** : Respectez les bonnes pratiques anti-spam (opt-out, contenu approprié, etc.)
4. **Logs** : Les erreurs sont logguées dans la console. Pour production, considérez un service de logging centralisé

## 🚀 Prochaines étapes

- [ ] Ajouter des templates supplémentaires (factures, relances, etc.)
- [ ] Intégrer les emails dans le workflow d'onboarding automatique
- [ ] Créer un système de logs d'emails dans la base de données
- [ ] Ajouter des webhooks Resend pour le suivi des événements (bounce, ouvert, cliqué)



