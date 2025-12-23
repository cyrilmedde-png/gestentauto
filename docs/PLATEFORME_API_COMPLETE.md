# Backend Plateforme - Documentation API Complète

## Vue d'ensemble

Le backend plateforme est maintenant complet avec toutes les APIs nécessaires pour gérer la plateforme SaaS. Toutes les routes utilisent le client tampon plateforme (`createPlatformClient()`) qui a accès à toutes les données via le service role key.

## Routes API disponibles

### 1. Companies (Entreprises clientes)

#### `GET /api/platform/companies`
Liste toutes les entreprises clientes (exclut la plateforme)

**Réponse** :
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Nom entreprise",
      "email": "email@entreprise.com",
      "phone": "...",
      "address": "...",
      "city": "...",
      "postal_code": "...",
      "country": "FR",
      "siret": "...",
      "vat_number": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### `GET /api/platform/companies/[id]`
Détails d'une entreprise cliente

#### `PATCH /api/platform/companies/[id]`
Mettre à jour une entreprise cliente

---

### 2. Users (Utilisateurs clients)

#### `GET /api/platform/users?company_id=xxx`
Liste tous les utilisateurs des entreprises clientes
- Optionnel : `?company_id=xxx` pour filtrer par entreprise

**Réponse** :
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@entreprise.com",
      "first_name": "...",
      "last_name": "...",
      "company_id": "uuid",
      "role_id": "uuid",
      "created_at": "...",
      "companies": { "id": "...", "name": "..." },
      "roles": { "id": "...", "name": "..." }
    }
  ]
}
```

#### `POST /api/platform/users`
Créer un nouvel utilisateur pour un client

**Body** :
```json
{
  "company_id": "uuid",
  "email": "user@entreprise.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role_id": "uuid (optionnel)"
}
```

#### `PATCH /api/platform/users/[id]`
Mettre à jour un utilisateur

**Body** :
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "role_id": "uuid"
}
```

#### `DELETE /api/platform/users/[id]`
Supprimer un utilisateur

#### `POST /api/platform/users/[id]/reset-password`
Réinitialiser le mot de passe d'un utilisateur

**Body** :
```json
{
  "new_password": "nouveauMotDePasse123"
}
```

---

### 3. Modules

#### `GET /api/platform/modules?company_id=xxx`
Liste tous les modules activés par entreprise
- Optionnel : `?company_id=xxx` pour filtrer par entreprise

#### `POST /api/platform/modules`
Activer un module pour une entreprise

**Body** :
```json
{
  "company_id": "uuid",
  "module_name": "facturation",
  "config": { "option1": "value1" } // optionnel
}
```

#### `PATCH /api/platform/modules/[id]`
Mettre à jour un module (activer/désactiver, modifier config)

**Body** :
```json
{
  "is_active": true,
  "config": { "option1": "value1" }
}
```

#### `DELETE /api/platform/modules/[id]`
Désactiver un module (soft delete)

#### `GET /api/platform/modules/available`
Liste tous les modules disponibles dans le système

**Réponse** :
```json
{
  "modules": [
    {
      "id": "facturation",
      "name": "Facturation",
      "description": "Gestion des devis, factures et paiements",
      "icon": "FileText",
      "category": "business"
    }
  ]
}
```

---

### 4. Roles (Rôles et permissions)

#### `GET /api/platform/roles?company_id=xxx`
Liste tous les rôles des entreprises clientes
- Optionnel : `?company_id=xxx` pour filtrer par entreprise

#### `POST /api/platform/roles`
Créer un nouveau rôle pour une entreprise

**Body** :
```json
{
  "company_id": "uuid",
  "name": "Manager",
  "permissions": {
    "facturation": { "read": true, "write": true },
    "crm": { "read": true, "write": false }
  }
}
```

#### `PATCH /api/platform/roles/[id]`
Mettre à jour un rôle

**Body** :
```json
{
  "name": "Manager",
  "permissions": { ... }
}
```

#### `DELETE /api/platform/roles/[id]`
Supprimer un rôle (vérifie qu'aucun utilisateur n'utilise ce rôle)

---

### 5. Settings (Paramètres)

#### `GET /api/platform/settings?company_id=xxx`
Liste tous les settings des entreprises clientes
- Optionnel : `?company_id=xxx` pour filtrer par entreprise

#### `POST /api/platform/settings`
Créer ou mettre à jour un setting pour une entreprise

**Body** :
```json
{
  "company_id": "uuid",
  "key": "subscription_status",
  "value": "active"
}
```

#### `PATCH /api/platform/settings/[id]`
Mettre à jour un setting

**Body** :
```json
{
  "value": "new_value"
}
```

#### `DELETE /api/platform/settings/[id]`
Supprimer un setting

---

### 6. Onboarding

#### `POST /api/platform/onboarding`
Créer un nouveau client (entreprise + utilisateur admin)

**Body** :
```json
{
  "companyName": "Nom entreprise",
  "companyEmail": "contact@entreprise.com",
  "companyPhone": "+33...",
  "companyAddress": "123 rue...",
  "companyCity": "Paris",
  "companyPostalCode": "75001",
  "companyCountry": "FR",
  "companySiret": "12345678901234",
  "companyVatNumber": "FR12345678901",
  "adminEmail": "admin@entreprise.com",
  "adminPassword": "password123",
  "adminFirstName": "John",
  "adminLastName": "Doe"
}
```

**Réponse** :
```json
{
  "success": true,
  "company": { ... },
  "user": { ... },
  "role": { ... }
}
```

Cette route crée automatiquement :
- L'entreprise
- L'utilisateur admin dans Supabase Auth
- L'entrée dans la table users
- Un rôle "Admin" par défaut
- L'association du rôle à l'utilisateur

---

### 7. Stats & Analytics

#### `GET /api/platform/stats`
Statistiques globales de la plateforme

**Réponse** :
```json
{
  "stats": {
    "companies": 10,
    "users": 45,
    "active_modules": 25
  }
}
```

#### `GET /api/platform/analytics/overview`
Vue d'ensemble des analytics

**Réponse** :
```json
{
  "overview": {
    "total_companies": 10,
    "total_users": 45,
    "active_modules": 25,
    "new_companies_this_month": 3,
    "new_users_this_month": 8
  }
}
```

---

## Sécurité

Toutes les routes :
- Vérifient que la plateforme est configurée
- Empêchent la modification/suppression des données plateforme
- Utilisent le client tampon plateforme (`createPlatformClient()`)
- Gèrent les erreurs proprement

## Notes importantes

1. **Ne jamais modifier la plateforme elle-même** : Toutes les routes vérifient que les opérations ne ciblent pas la plateforme (via `platformId`)

2. **Clients des clients** : Ces APIs ne touchent JAMAIS aux données "clients des clients" (ex: table `customers`, `invoices`, etc.). Ces données restent isolées par `company_id` et ne sont accessibles que via les APIs client.

3. **Nettoyage** : Les routes de création (onboarding, users) incluent un nettoyage en cas d'erreur (rollback)

4. **Validation** : Toutes les routes valident les champs requis avant traitement

## Prochaines étapes

Pour compléter encore plus le backend plateforme, on pourrait ajouter :
- Routes pour les abonnements Stripe (`/api/platform/subscriptions/*`)
- Routes analytics plus détaillées (`/api/platform/analytics/*`)
- Routes pour le support client (`/api/platform/support/*`)
- Routes pour les exports de données (`/api/platform/exports/*`)


