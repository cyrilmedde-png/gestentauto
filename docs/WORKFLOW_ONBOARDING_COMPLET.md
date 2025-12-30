# 🚀 Workflow d'Onboarding Complet

## 📋 Vue d'ensemble

Ce document décrit le processus complet d'onboarding des clients, depuis la pré-inscription jusqu'à la conversion en client actif.

---

## 🔄 Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    ÉTAPE 1 : PRÉ-INSCRIPTION                    │
│                 (Formulaire public /auth/register)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Client remplit le formulaire
                    (Prénom, Nom, Email, Téléphone, Entreprise)
                              ↓
          ┌────────────────────────────────────────────┐
          │  API: /api/auth/register-lead              │
          │  - Validation des données                  │
          │  - Vérification email unique               │
          │  - Création dans platform_leads            │
          │  - Statut: "pre_registered"                │
          └────────────────────────────────────────────┘
                              ↓
          ┌────────────────────────────────────────────┐
          │  Workflow N8N: inscription-lead            │
          │  1. Email bienvenue au lead                │
          │  2. SMS au lead                            │
          │  3. SMS notification admin                 │
          │  4. Notification in-app admin              │
          └────────────────────────────────────────────┘
                              ↓
                    Message au client :
        "Merci ! Nous vous contacterons sous 24h"

┌─────────────────────────────────────────────────────────────────┐
│              ÉTAPE 2 : QUALIFICATION (Manuel)                   │
│              Interface /platform/leads                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                Votre équipe contacte le lead
                              ↓
          ┌────────────────────────────────────────────┐
          │  Questionnaire de qualification            │
          │  - Besoins du client                       │
          │  - Budget                                  │
          │  - Timeline                                │
          │  Statut: "questionnaire_completed"         │
          └────────────────────────────────────────────┘
                              ↓
          ┌────────────────────────────────────────────┐
          │  Entretien avec le lead                    │
          │  - Présentation de la plateforme           │
          │  - Réponses aux questions                  │
          │  Statut: "interview_scheduled"             │
          └────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         ÉTAPE 3 : CRÉATION DE L'ESSAI GRATUIT (Manuel)          │
│              Bouton "Créer essai" dans interface                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        Vous cliquez sur "🚀 Créer essai"
                              ↓
          ┌────────────────────────────────────────────┐
          │  Modal de configuration                    │
          │  - Durée : 7/14/30 jours                   │
          │  - Modules à activer                       │
          │  - Validation                              │
          └────────────────────────────────────────────┘
                              ↓
          ┌────────────────────────────────────────────┐
          │  API: /api/platform/trials/create          │
          │  1. Génération mot de passe                │
          │  2. Création auth.users                    │
          │  3. Création company                       │
          │  4. Création role "Propriétaire"           │
          │  5. Création public.users                  │
          │  6. Création platform_trials               │
          │  7. Mise à jour statut lead                │
          └────────────────────────────────────────────┘
                              ↓
          ┌────────────────────────────────────────────┐
          │  Workflow N8N: creer-essai                 │
          │  1. Email identifiants complet             │
          │  2. SMS "Essai activé"                     │
          └────────────────────────────────────────────┘
                              ↓
                Le client reçoit :
        - Email avec identifiants (login + password)
        - SMS de confirmation
        - Lien de connexion

┌─────────────────────────────────────────────────────────────────┐
│              ÉTAPE 4 : PÉRIODE D'ESSAI (7-30 jours)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
            Le client utilise la plateforme
            - Accès à tous les modules activés
            - Support disponible
            - Statut: "trial_started"
                              ↓
              Fin de la période d'essai
                              ↓
                    Décision du client

┌─────────────────────────────────────────────────────────────────┐
│                  ÉTAPE 5 : CONVERSION                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
          ┌─────────────────┴──────────────────┐
          ↓                                     ↓
    Client accepte                      Client refuse
          ↓                                     ↓
  Création subscription              Désactivation compte
  Statut: "converted"               Statut: "abandoned"
```

---

## 📁 Fichiers Impliqués

### **API Routes**

| Fichier | Description | Rôle |
|---------|-------------|------|
| `/app/api/auth/register-lead/route.ts` | Pré-inscription lead | Crée le lead dans `platform_leads` |
| `/app/api/platform/trials/create/route.ts` | Création essai | Crée le compte complet + essai |

### **Composants**

| Fichier | Description |
|---------|-------------|
| `/app/auth/register/page.tsx` | Page d'inscription publique |
| `/app/platform/leads/page.tsx` | Liste des leads pour admin |
| `/components/platform/CreateTrialModal.tsx` | Modal création essai |

### **Workflows N8N**

| Fichier | Description | Webhook |
|---------|-------------|---------|
| `/n8n-workflows/inscription-lead.json` | Notifications pré-inscription | `/webhook/inscription-lead` |
| `/n8n-workflows/creer-essai.json` | Envoi identifiants | `/webhook/creer-essai` |

### **Base de Données**

| Table | Description |
|-------|-------------|
| `platform_leads` | Tous les leads (pré-inscrits) |
| `platform_onboarding_questionnaires` | Questionnaires remplis |
| `platform_onboarding_interviews` | Entretiens planifiés |
| `platform_trials` | Essais gratuits actifs |
| `companies` | Entreprises des clients |
| `users` | Utilisateurs (après essai) |
| `auth.users` | Comptes d'authentification |

---

## 🔐 Statuts des Leads

| Statut | Description | Étape |
|--------|-------------|-------|
| `pre_registered` | Lead vient de s'inscrire | 1 |
| `questionnaire_completed` | Questionnaire rempli | 2 |
| `interview_scheduled` | Entretien planifié | 2 |
| `trial_started` | Essai en cours | 3 |
| `converted` | Client actif | 5 |
| `abandoned` | Lead abandonné | 5 |

---

## 📧 Emails Envoyés

### **1. Email de Bienvenue (Pré-inscription)**
- **Quand** : Après inscription sur `/auth/register`
- **À qui** : Lead
- **Contenu** : "Merci, nous vous contactons sous 24h"
- **Workflow** : `inscription-lead.json`

### **2. Email Identifiants (Essai)**
- **Quand** : Après création de l'essai
- **À qui** : Lead devenu testeur
- **Contenu** : 
  - Identifiants de connexion (email + password)
  - Lien de connexion
  - Date d'expiration de l'essai
  - Modules activés
- **Workflow** : `creer-essai.json`

---

## 📱 SMS Envoyés

### **1. SMS Lead (Pré-inscription)**
- **À qui** : Lead
- **Message** : "Merci pour votre intérêt pour Talos Prime ! Notre équipe va vous contacter sous 24h..."

### **2. SMS Admin (Notification Lead)**
- **À qui** : Administrateur (+33766658863)
- **Message** : "🆕 Nouveau lead inscrit ! Nom : ... Email : ... Téléphone : ..."

### **3. SMS Essai Activé**
- **À qui** : Lead (devenu testeur)
- **Message** : "🎉 Votre essai Talos Prime est activé ! Connectez-vous sur..."

---

## 🧪 Tests

### **Test 1 : Pré-inscription**
1. Aller sur `https://www.talosprimes.com/auth/register`
2. Remplir le formulaire (avec un nouvel email)
3. Vérifier : 
   - Message de succès affiché
   - Lead créé dans `platform_leads`
   - Email bienvenue reçu
   - SMS reçu
   - Notification admin reçue

### **Test 2 : Création d'essai**
1. Aller sur `https://www.talosprimes.com/platform/leads`
2. Trouver un lead avec statut `questionnaire_completed` ou `interview_scheduled`
3. Cliquer sur "🚀 Créer essai"
4. Configurer (14 jours, modules CRM+Clients)
5. Valider
6. Vérifier :
   - Essai créé dans `platform_trials`
   - Compte créé dans `auth.users`
   - Company créée dans `companies`
   - User créé dans `users`
   - Email identifiants reçu
   - SMS reçu
   - Client peut se connecter

---

## ⚙️ Configuration Requise

### **Variables d'environnement**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### **N8N**
- Les 2 workflows doivent être importés et **ACTIVÉS** :
  - `inscription-lead.json`
  - `creer-essai.json`
- Webhooks configurés :
  - `https://n8n.talosprimes.com/webhook/inscription-lead`
  - `https://n8n.talosprimes.com/webhook/creer-essai`

---

## 🚨 Points d'Attention

### **Sécurité**
- Les mots de passe sont générés avec 12 caractères (majuscules, minuscules, chiffres, spéciaux)
- Les emails sont vérifiés pour éviter les doublons
- Les numéros de téléphone doivent commencer par `+33`

### **Performance**
- Le workflow N8N est appelé de façon asynchrone (non-bloquant)
- Si N8N échoue, l'inscription/essai continue quand même

### **Rollback**
- Si la création d'essai échoue, le compte `auth.users` est automatiquement supprimé

---

## 📊 Métriques à Suivre

- Nombre de pré-inscriptions par jour
- Taux de conversion (pre_registered → trial_started)
- Taux de conversion (trial_started → converted)
- Durée moyenne entre pré-inscription et essai
- Durée moyenne de l'essai avant conversion
- Modules les plus utilisés pendant l'essai

---

**🎯 Ce workflow garantit un onboarding fluide, automatisé et traçable du début à la fin !**

