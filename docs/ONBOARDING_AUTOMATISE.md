# Module d'Onboarding Automatisé

## Vue d'ensemble

Ce module permet de gérer automatiquement l'onboarding des nouveaux clients depuis la pré-inscription jusqu'au démarrage de l'essai gratuit de 7 jours.

## Workflow complet

```
1. Pré-inscription (Formulaire)
   ↓
2. Questionnaire (Besoins et métier)
   ↓
3. Analyse automatique → Recommandations modules
   ↓
4. Proposition d'entretien
   ↓
5. Entretien planifié
   ↓
6. Démarrage essai gratuit (7 jours)
   ↓
7. Conversion en client payant
```

## Tables de base de données

### `leads`
Stocke les pré-inscriptions avec statut et étape

**Statuts** :
- `pre_registered` : Pré-inscription effectuée
- `questionnaire_completed` : Questionnaire rempli
- `interview_scheduled` : Entretien planifié
- `trial_started` : Essai démarré
- `converted` : Converti en client payant
- `abandoned` : Abandonné

**Étapes** :
- `form` : Formulaire initial
- `questionnaire` : Questionnaire en cours
- `interview` : Entretien
- `trial` : Essai gratuit
- `completed` : Terminé

### `onboarding_questionnaires`
Réponses au questionnaire et recommandations automatiques

### `onboarding_interviews`
Entretiens planifiés avec les leads

### `trials`
Essais gratuits actifs ou terminés

## APIs disponibles

### 1. Pré-inscription

**POST `/api/platform/leads`**
```json
{
  "email": "client@example.com",
  "first_name": "Jean",
  "last_name": "Dupont",
  "phone": "+33...",
  "company_name": "Ma Société"
}
```

**Réponse** :
```json
{
  "lead": {
    "id": "uuid",
    "email": "...",
    "status": "pre_registered",
    "onboarding_step": "form"
  }
}
```

### 2. Questionnaire

**POST `/api/platform/leads/[id]/questionnaire`**
```json
{
  "request_type": "trial_7days",
  "business_sector": "commerce",
  "business_size": "pme",
  "current_tools": ["Excel", "Word"],
  "main_needs": ["facturation", "gestion_stock"],
  "budget_range": "100-500",
  "timeline": "1_month",
  "additional_info": "..."
}
```

**Réponse** :
```json
{
  "questionnaire": { ... },
  "recommendations": {
    "modules": ["facturation", "stock", "crm"],
    "trial_config": {
      "type": "full_access",
      "duration_days": 7,
      "enabled_modules": [...]
    },
    "next_step": "interview"
  }
}
```

### 3. Entretien

**POST `/api/platform/leads/[id]/interview`**
```json
{
  "scheduled_at": "2025-01-15T14:00:00Z",
  "meeting_link": "https://cal.com/...",
  "interviewer_id": "uuid (optionnel)"
}
```

**GET `/api/platform/leads/[id]/interview`**
Récupère l'entretien d'un lead

**PATCH `/api/platform/leads/[id]/interview`**
Met à jour l'entretien (notes, statut, etc.)

### 4. Démarrage de l'essai

**POST `/api/platform/leads/[id]/trial/start`**

Cette route crée automatiquement :
- L'entreprise
- L'utilisateur admin dans Supabase Auth
- L'entrée dans la table users
- Les modules recommandés activés
- Un rôle Admin
- L'essai gratuit de 7 jours

**Réponse** :
```json
{
  "trial": { ... },
  "company": { ... },
  "user": { ... },
  "credentials": {
    "email": "client@example.com",
    "temporary_password": "...",
    "login_url": "/auth/login?email=..."
  },
  "modules_activated": ["facturation", "stock", "crm"]
}
```

## Recommandations automatiques

Le système analyse automatiquement le questionnaire et recommande :
- Les modules adaptés au secteur d'activité
- Les modules selon les besoins exprimés
- La configuration de l'essai (type, durée, modules)

### Secteurs d'activité supportés

- `commerce` : stock, facturation, crm, reporting
- `restauration` : stock, rh, projets, facturation
- `immobilier` : documents, crm, projets, comptabilite
- `sante` : documents, crm, rh, projets
- `education` : documents, rh, projets, reporting
- `transport` : stock, projets, rh, facturation
- `conseil` : documents, projets, crm, reporting
- `autre` : facturation, crm, documents

## Installation

1. Exécuter le script SQL :
```bash
# Dans Supabase SQL Editor
database/schema_onboarding.sql
```

2. Vérifier que les tables sont créées

3. Tester le workflow :
   - Pré-inscription
   - Questionnaire
   - Entretien
   - Démarrage essai

## Tests

### Test 1 : Pré-inscription
```bash
curl -X POST http://localhost:3000/api/platform/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "company_name": "Test Company"
  }'
```

### Test 2 : Questionnaire
```bash
curl -X POST http://localhost:3000/api/platform/leads/{LEAD_ID}/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "request_type": "trial_7days",
    "business_sector": "commerce",
    "business_size": "pme",
    "main_needs": ["facturation", "stock"]
  }'
```

### Test 3 : Démarrage essai
```bash
curl -X POST http://localhost:3000/api/platform/leads/{LEAD_ID}/trial/start
```

## Prochaines étapes

- [ ] Emails automatiques (Resend)
- [ ] Rappels automatiques pendant l'essai
- [ ] Conversion automatique en client payant
- [ ] Dashboard plateforme pour suivre les leads
- [ ] Statistiques d'onboarding

