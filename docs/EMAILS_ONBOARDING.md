# 📧 Emails automatiques dans le workflow d'onboarding

## 📋 Vue d'ensemble

Les emails sont automatiquement envoyés à chaque étape du workflow d'onboarding pour guider les prospects et les tenir informés de leur progression.

## 🔄 Emails envoyés automatiquement

### 1. Pré-inscription (`POST /api/platform/leads`)

**Quand :** Un nouveau lead est créé (formulaire de pré-inscription rempli)

**Email envoyé :** `sendOnboardingConfirmationEmail()`

**Contenu :**
- Confirmation de réception de la pré-inscription
- Présentation des prochaines étapes
- Lien vers le questionnaire (si applicable)

**Template :** `lib/services/email.ts` - fonction `sendOnboardingConfirmationEmail()`

---

### 2. Questionnaire complété (`POST /api/platform/leads/[id]/questionnaire`)

**Quand :** Un lead complète le questionnaire de besoins

**Email envoyé :** Email personnalisé avec recommandations

**Contenu :**
- Confirmation de complétion du questionnaire
- Liste des modules recommandés (basés sur les réponses)
- Prochaine étape (essai direct ou entretien)

**Template :** Inline dans la route API avec HTML stylisé

---

### 3. Entretien programmé (`POST /api/platform/leads/[id]/interview`)

**Quand :** Un entretien est programmé pour un lead

**Email envoyé :** `sendInterviewConfirmationEmail()`

**Contenu :**
- Date et heure de l'entretien
- Lien de réunion (si fourni)
- Rappel des informations importantes

**Template :** `lib/services/email.ts` - fonction `sendInterviewConfirmationEmail()`

---

### 4. Démarrage d'essai (`POST /api/platform/leads/[id]/trial`)

**Quand :** Un essai gratuit de 7 jours démarre pour un lead

**Email envoyé :** Email de bienvenue avec identifiants

**Contenu :**
- Identifiants de connexion (email + mot de passe temporaire)
- Lien de connexion direct
- Liste des modules activés
- Date de fin de l'essai
- Rappel de changer le mot de passe

**Template :** Inline dans la route API avec HTML stylisé

**Sécurité :** Le mot de passe temporaire est généré aléatoirement et inclus dans l'email.

---

## 🛡️ Gestion des erreurs

**Principe :** Les emails ne doivent **jamais bloquer** le workflow d'onboarding.

### Implémentation

Tous les appels d'envoi d'email sont encapsulés dans des `try/catch` :

```typescript
try {
  await sendEmail(...)
} catch (emailError) {
  console.error('Error sending email:', emailError)
  // On continue quand même, l'email n'est pas critique
}
```

### Logging

Les erreurs d'envoi d'email sont loguées dans la console pour faciliter le débogage, mais n'interrompent pas le processus métier.

---

## 📝 Variables d'environnement nécessaires

Pour que les emails fonctionnent, vous devez configurer :

```env
RESEND_API_KEY=re_votre_cle_api
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime
NEXT_PUBLIC_APP_URL=https://talosprime.fr  # Pour les liens dans les emails
```

---

## 🔍 Points d'intégration dans le code

### 1. Pré-inscription
**Fichier :** `app/api/platform/leads/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après création du lead (ligne ~119)

### 2. Questionnaire complété
**Fichier :** `app/api/platform/leads/[id]/questionnaire/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après sauvegarde du questionnaire et mise à jour du lead (ligne ~85)

### 3. Entretien programmé
**Fichier :** `app/api/platform/leads/[id]/interview/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après création de l'entretien (ligne ~74)

### 4. Démarrage d'essai
**Fichier :** `app/api/platform/leads/[id]/trial/route.ts`  
**Fonction :** `POST()`  
**Ligne :** Après création de l'essai et de l'entreprise (ligne ~234)

---

## 🎨 Personnalisation des templates

### Modifier les templates existants

Les templates sont définis dans :
- **Fonctions réutilisables :** `lib/services/email.ts`
  - `sendOnboardingConfirmationEmail()`
  - `sendInterviewConfirmationEmail()`
  
- **Templates inline :** Dans les routes API elles-mêmes
  - Questionnaire complété
  - Démarrage d'essai

### Style commun

Tous les emails utilisent un style cohérent :
- En-tête : Fond sombre (#080808) avec titre
- Contenu : Fond clair (#f9f9f9) avec padding
- Boutons : Style #26283d (violet foncé)
- Responsive : Adapté mobile et desktop

### Exemple de personnalisation

Pour modifier un email, éditez simplement la fonction correspondante ou le template inline dans la route API.

---

## 🧪 Tester les emails

### Test manuel

1. **Test pré-inscription :**
   ```bash
   POST /api/platform/leads
   {
     "email": "test@example.com",
     "first_name": "Test",
     "last_name": "User"
   }
   ```

2. **Test questionnaire :**
   ```bash
   POST /api/platform/leads/{lead_id}/questionnaire
   {
     "request_type": "trial_7days",
     "business_sector": "commerce"
   }
   ```

3. **Test entretien :**
   ```bash
   POST /api/platform/leads/{lead_id}/interview
   {
     "scheduled_at": "2024-01-15T14:00:00Z",
     "meeting_link": "https://meet.google.com/xxx"
   }
   ```

4. **Test essai :**
   ```bash
   POST /api/platform/leads/{lead_id}/trial
   ```

### Test direct d'envoi d'email

Vous pouvez aussi tester directement l'envoi d'email avec :
```bash
GET /api/email/test?to=votre-email@example.com
```

---

## 📊 Monitoring

### Dashboard Resend

Consultez le dashboard Resend pour :
- Voir les emails envoyés
- Vérifier les taux de livraison
- Consulter les logs d'erreurs
- Gérer les domaines vérifiés

**Lien :** [https://resend.com/emails](https://resend.com/emails)

### Logs applicatifs

Les erreurs d'envoi sont loguées dans la console de l'application avec :
- Le contexte (quelle étape du workflow)
- Le type d'erreur
- Les détails techniques

---

## 🔒 Sécurité

- ✅ Mot de passe temporaire généré aléatoirement (16 caractères avec caractères spéciaux)
- ✅ Rappel de changer le mot de passe dans l'email d'essai
- ✅ Liens sécurisés (HTTPS requis)
- ✅ Validation des données avant envoi
- ✅ Protection contre l'injection HTML (templates sécurisés)

---

## 🚀 Prochaines améliorations possibles

- [ ] Créer une table `email_logs` pour tracer tous les emails envoyés
- [ ] Ajouter des emails de rappel automatiques (ex: 24h après questionnaire sans action)
- [ ] Emails de suivi post-essai (conversion, feedback, etc.)
- [ ] Personnalisation des templates par entreprise
- [ ] Support multilingue (FR, EN, etc.)
- [ ] Templates éditable depuis l'interface admin

