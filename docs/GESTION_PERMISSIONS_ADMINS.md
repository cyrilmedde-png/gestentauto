# 🛡️ Gestion Permissions Administrateurs

## ✅ Ce Qui A Été Créé

### 1. **Modal d'Édition Admin** (`/platform/admins`)
- 📝 **Modifier le profil** : Email, prénom, nom
- 🔒 **Gérer les permissions** : Toggle par fonctionnalité
- 💾 **Enregistrement automatique** : Met à jour DB + auth.users

### 2. **API Route** (`/api/admin/users/update-admin`)
- Met à jour `public.users` (profil + permissions)
- Met à jour `auth.users` (email si changé)
- Envoie email de notification avec liste permissions
- Logs détaillés pour debug

### 3. **Migration SQL** (`database/add_admin_permissions.sql`)
- Ajoute colonne `permissions` (JSONB)
- Définit permissions par défaut (tout activé)
- Index GIN pour recherches rapides

---

## 🎯 Permissions Disponibles

| Permission | Description | Icon |
|------------|-------------|------|
| `logs` | Accès aux logs système | 📊 |
| `plans` | Gestion des plans d'abonnement | ⚙️ |
| `subscriptions` | Gestion des abonnements | 💳 |
| `admins` | Gestion des administrateurs | 🛡️ |
| `analytics` | Accès aux analytics | 📈 |
| `clients` | Gestion des clients | 👥 |
| `users` | Gestion des utilisateurs | 👤 |
| `modules` | Gestion des modules | 📦 |

---

## 📋 Structure Permissions (JSONB)

```json
{
  "logs": true,
  "plans": true,
  "subscriptions": true,
  "admins": true,
  "analytics": true,
  "clients": true,
  "users": true,
  "modules": true
}
```

---

## 🚀 Installation

### Étape 1 : Migration SQL

```bash
# Supabase SQL Editor
# Copier-coller le contenu de:
database/add_admin_permissions.sql
```

### Étape 2 : Déployer VPS

```bash
cd /var/www/talosprime
git pull origin main
npm run build
pm2 restart talosprime
```

---

## 🧪 Utilisation

### 1. **Ouvrir la Page Admins**
```
https://www.talosprimes.com/platform/admins
```

### 2. **Cliquer "Modifier" sur un Admin**
- Modal s'ouvre avec profil + permissions

### 3. **Modifier le Profil**
- Email, prénom, nom
- Changements automatiquement appliqués à `auth.users`

### 4. **Toggle Permissions**
- Activer/désactiver chaque fonctionnalité
- Changements enregistrés dans `users.permissions`

### 5. **Enregistrer**
- Cliquer "Enregistrer"
- L'admin reçoit un email récapitulatif

---

## 🔒 Protections

### ✅ Sécurité
- Seuls les admins plateforme peuvent modifier
- Vérification `isPlatformCompany()`
- Logs détaillés de toutes les modifications

### ✅ Validation
- Email doit être valide
- Permissions doivent être un objet JSONB valide
- Mise à jour atomique (DB + auth)

---

## 📧 Email Notification

Envoyé automatiquement à l'admin modifié :

```
Objet: Mise à jour de votre profil administrateur

Bonjour [Prénom],

Votre profil administrateur a été mis à jour.

Vos permissions :
✅ Logs Système
✅ Gestion des Plans
❌ Abonnements
...

Si vous n'êtes pas à l'origine de cette modification, 
contactez immédiatement l'administrateur principal.
```

---

## 🔍 Logs Console

### Logs Importants

```bash
# Tentative de modification
🔄 Mise à jour admin: { user_id: "...", email: "...", by: "admin@..." }

# Succès
✅ Admin mis à jour avec succès: email@example.com

# Erreur
❌ Erreur lors de la mise à jour: [détails]
```

---

## 🎨 Design

### Modal
- 🌑 **Dark glassmorphism**
- 🎨 **Gradient blue-purple**
- 📱 **Responsive** (mobile-friendly)
- 🔄 **Loading states** (enregistrement)

### Toggle Permissions
- 🟢 **Bleu activé** / 🔴 **Gris désactivé**
- 🎯 **Visuel clair** avec icônes
- 🔊 **Feedback instantané**

---

## 📊 Exemple Requête API

### Request

```bash
curl -X POST https://www.talosprimes.com/api/admin/users/update-admin \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "dd42b846-61e7-4c97-ab7c-c58f6539719b",
    "first_name": "Cyril",
    "last_name": "Medde",
    "email": "cyrilmedde@gmail.com",
    "permissions": {
      "logs": true,
      "plans": true,
      "subscriptions": false,
      "admins": true,
      "analytics": true,
      "clients": true,
      "users": true,
      "modules": false
    }
  }'
```

### Response

```json
{
  "success": true,
  "message": "Administrateur mis à jour avec succès"
}
```

---

## ⚠️ Notes Importantes

### 1. **Permissions par Défaut**
Tous les nouveaux admins ont **toutes les permissions activées** par défaut.

### 2. **Email Change**
Si l'email change :
- ✅ `public.users` mis à jour
- ✅ `auth.users` mis à jour
- ✅ Email de confirmation envoyé au nouvel email

### 3. **Permissions = JSONB**
Les permissions sont stockées en JSONB pour :
- ⚡ Requêtes rapides
- 🔧 Flexibilité (ajouter/retirer facilement)
- 📊 Index GIN pour recherches

### 4. **Pas de Suppression**
Le modal permet de **modifier**, pas de **supprimer**.
Pour supprimer → Bouton "Retirer" dans le tableau.

---

## 🔮 Évolution Future

### Possibilités
- 🎯 **Permissions granulaires** (lecture/écriture/suppression)
- 👥 **Rôles prédéfinis** (Super Admin, Admin, Modérateur)
- 📊 **Historique modifications** (audit trail)
- 🔔 **Notifications in-app** (en plus de l'email)
- ⏱️ **Permissions temporaires** (expire après X jours)

---

## ✅ Checklist Déploiement

- [ ] Exécuter `database/add_admin_permissions.sql` dans Supabase
- [ ] `git pull` sur VPS
- [ ] `npm run build` sur VPS
- [ ] `pm2 restart talosprime` sur VPS
- [ ] Tester modification profil
- [ ] Tester toggle permissions
- [ ] Vérifier email notification reçu
- [ ] Vérifier logs PM2

---

## 🎉 Résultat Final

### Fonctionnalités
✅ Modifier profil admin (email, prénom, nom)
✅ Gérer permissions (8 fonctionnalités)
✅ Toggle visuel clair
✅ Email notification automatique
✅ Logs détaillés
✅ Design dark moderne

### Sécurité
✅ Seuls admins plateforme peuvent modifier
✅ Vérification `isPlatformCompany()`
✅ Validation données
✅ Logs toutes actions

---

**PRÊT À DÉPLOYER ! 🚀**

