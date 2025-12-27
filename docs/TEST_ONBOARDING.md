# Tests du Module d'Onboarding

## Prérequis

1. Exécuter le script SQL `database/schema_onboarding.sql` dans Supabase
2. Le serveur de développement doit être lancé (`npm run dev`)
3. Avoir les variables d'environnement Supabase configurées

## Tests séquentiels

### 1. Test Pré-inscription

```bash
curl -X POST http://localhost:3000/api/platform/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.onboarding@example.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "+33612345678",
    "company_name": "Test Company SARL"
  }'
```

**Résultat attendu** :
- Status 201
- Lead créé avec `status: "pre_registered"` et `onboarding_step: "form"`
- Notez le `id` du lead pour les tests suivants

### 2. Test Récupération Lead

```bash
curl http://localhost:3000/api/platform/leads/{LEAD_ID}
```

**Résultat attendu** :
- Détails du lead avec questionnaire, interview, trial à null

### 3. Test Questionnaire

Remplacez `{LEAD_ID}` par l'ID obtenu à l'étape 1.

```bash
curl -X POST http://localhost:3000/api/platform/leads/{LEAD_ID}/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "request_type": "trial_7days",
    "business_sector": "commerce",
    "business_size": "pme",
    "current_tools": ["Excel", "Word"],
    "main_needs": ["facturation", "gestion_stock", "crm"],
    "budget_range": "100-500",
    "timeline": "1_month",
    "additional_info": "Je cherche une solution complète pour gérer mon commerce"
  }'
```

**Résultat attendu** :
- Status 201
- Questionnaire sauvegardé
- Recommandations générées (modules: facturation, stock, crm, etc.)
- Lead mis à jour : `status: "questionnaire_completed"`

### 4. Test Planification Entretien

```bash
curl -X POST http://localhost:3000/api/platform/leads/{LEAD_ID}/interview \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_at": "2025-01-20T14:00:00Z",
    "meeting_link": "https://cal.com/entretien-test",
    "notes": "Entretien de découverte"
  }'
```

**Résultat attendu** :
- Status 201
- Interview créé avec `status: "scheduled"`
- Lead mis à jour : `status: "interview_scheduled"` et `onboarding_step: "interview"`

### 5. Test Démarrage Essai

⚠️ **ATTENTION** : Cette route crée réellement une entreprise et un utilisateur !

```bash
curl -X POST http://localhost:3000/api/platform/leads/{LEAD_ID}/trial/start
```

**Résultat attendu** :
- Status 201
- Entreprise créée
- Utilisateur créé dans Supabase Auth
- Modules activés (facturation, stock, crm)
- Essai créé avec dates de début/fin
- Credentials retournés avec mot de passe temporaire
- Lead mis à jour : `status: "trial_started"` et `onboarding_step: "trial"`

### 6. Test Récupération Lead Complet

```bash
curl http://localhost:3000/api/platform/leads/{LEAD_ID}
```

**Résultat attendu** :
- Lead avec questionnaire, interview, et trial renseignés

### 7. Test Liste des Leads

```bash
# Tous les leads
curl http://localhost:3000/api/platform/leads

# Leads avec statut spécifique
curl "http://localhost:3000/api/platform/leads?status=trial_started"

# Leads par étape
curl "http://localhost:3000/api/platform/leads?step=trial"
```

## Vérifications dans Supabase

Après les tests, vérifier dans Supabase Dashboard :

1. **Table `leads`** : Lead créé avec les bonnes valeurs
2. **Table `onboarding_questionnaires`** : Questionnaire avec recommandations
3. **Table `onboarding_interviews`** : Interview planifié
4. **Table `trials`** : Essai actif
5. **Table `companies`** : Entreprise créée
6. **Table `users`** : Utilisateur créé
7. **Table `modules`** : Modules activés pour l'entreprise
8. **Supabase Auth** : Utilisateur créé avec l'email

## Erreurs courantes

### "Lead not found"
- Vérifier que l'ID du lead est correct
- Vérifier que le script SQL a été exécuté

### "Questionnaire not found" lors du démarrage de l'essai
- Le questionnaire doit être complété avant de démarrer l'essai
- Utiliser l'API POST `/api/platform/leads/[id]/questionnaire` d'abord

### "Platform not configured"
- Vérifier que le script `create_platform_admin.sql` a été exécuté
- Vérifier que le setting `platform_company_id` existe

## Nettoyage après tests

Pour supprimer les données de test :

```sql
-- Dans Supabase SQL Editor
DELETE FROM trials WHERE lead_id IN (SELECT id FROM leads WHERE email LIKE 'test.%');
DELETE FROM onboarding_interviews WHERE lead_id IN (SELECT id FROM leads WHERE email LIKE 'test.%');
DELETE FROM onboarding_questionnaires WHERE lead_id IN (SELECT id FROM leads WHERE email LIKE 'test.%');
DELETE FROM leads WHERE email LIKE 'test.%';
```





