# 🚀 Système d'Inscription Automatique Complet

## 📋 Vue d'ensemble

Ce système permet l'inscription automatique des utilisateurs avec :
- ✅ Génération automatique de mot de passe sécurisé
- ✅ Email avec identifiants (mot de passe temporaire)
- ✅ SMS de bienvenue à l'utilisateur
- ✅ **SMS de notification admin**
- ✅ **Notification in-app pour l'admin**
- ✅ Obligation de changer le mot de passe à la première connexion
- ✅ Validation du téléphone (+33 obligatoire)

---

## 🎯 Flux Complet

```
┌─────────────────────────────────────────┐
│ Utilisateur remplit le formulaire       │
│ (Prénom, Nom, Email, Téléphone)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ API /api/auth/register-simple           │
│ (Validation des données)                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Webhook N8N déclenché                    │
│ /webhook/inscription-utilisateur        │
└──────────────┬──────────────────────────┘
               │
               ├──→ Génère mot de passe (ex: Xk9#mQ2p!vL8)
               │
               ├──→ Crée compte Supabase Auth + Table users
               │    password_change_required = TRUE
               │
               ├──→ Email à l'utilisateur (avec mot de passe)
               │
               ├──→ SMS à l'utilisateur (bienvenue)
               │
               ├──→ SMS à VOUS (nouveau client inscrit)
               │
               └──→ Notification in-app pour VOUS
                    (Badge rouge sur l'icône 🔔)
```

---

## 📁 Fichiers Créés

### **1. Workflow N8N**
- `n8n-workflows/inscription-utilisateur-automatique.json`

### **2. APIs**
- `app/api/auth/register-simple/route.ts` - API d'inscription simplifiée
- `app/api/auth/create-user-with-password/route.ts` - Création utilisateur avec mot de passe
- `app/api/auth/change-password/route.ts` - Changement de mot de passe
- `app/api/notifications/admin/route.ts` - Gestion des notifications admin

### **3. Pages**
- `app/auth/register-simple/page.tsx` - Formulaire d'inscription
- `app/auth/change-password-required/page.tsx` - Page de changement de mot de passe obligatoire

### **4. Composants**
- `components/notifications/NotificationBell.tsx` - Icône de notification avec badge

### **5. Utils**
- `lib/utils/passwordGenerator.ts` - Générateur de mot de passe sécurisé

### **6. Middleware**
- `middleware.ts` - Vérification du mot de passe temporaire

### **7. Base de données**
- `supabase/migrations/20250129_add_password_change_and_notifications.sql`

---

## 🔧 Installation et Configuration

### **Étape 1 : Appliquer les migrations SQL**

```bash
# Se connecter à Supabase
# Aller dans SQL Editor
# Copier/coller le contenu de supabase/migrations/20250129_add_password_change_and_notifications.sql
# Exécuter
```

### **Étape 2 : Importer le workflow N8N**

1. Ouvrir N8N : `https://n8n.talosprimes.com`
2. Workflows → Import → Sélectionner `inscription-utilisateur-automatique.json`
3. **Configurer le nœud "SMS Admin (notification)"** :
   - Remplacer `+33VOTRE_NUMERO_ADMIN` par votre numéro de téléphone
4. **Activer le workflow** (bouton "Active")

### **Étape 3 : Ajouter le NotificationBell dans le Header**

Modifier `app/platform/layout.tsx` ou votre layout principal :

```typescript
import { NotificationBell } from '@/components/notifications/NotificationBell'

// Dans votre header :
<header className="flex items-center justify-between">
  <h1>Talos Prime</h1>
  <div className="flex items-center gap-4">
    <NotificationBell /> {/* Ajouter ici */}
    {/* ... autres éléments du header */}
  </div>
</header>
```

### **Étape 4 : Build et Redémarrer**

```bash
npm run build
pm2 restart talosprime
```

---

## 🧪 Test du Système

### **1. Test depuis le formulaire**

Aller sur : `https://www.talosprimes.com/auth/register-simple`

Remplir :
- Prénom : Jean
- Nom : Dupont
- Email : jean.dupont@example.com
- Téléphone : +33612345678
- Entreprise : ACME Corp (optionnel)

**Résultat attendu :**
1. ✅ Message de succès "Inscription réussie !"
2. ✅ Email reçu avec mot de passe temporaire (ex: `Xk9#mQ2p!vL8`)
3. ✅ SMS reçu : "Bienvenue sur Talos Prime ! Consultez votre email..."
4. ✅ **VOUS recevez un SMS** : "🎉 Nouveau client inscrit ! Jean Dupont..."
5. ✅ **Badge rouge (1) sur la cloche 🔔** dans l'app

### **2. Test de connexion**

1. Aller sur `/auth/login`
2. Se connecter avec l'email et le mot de passe temporaire
3. **Redirection automatique** vers `/auth/change-password-required`
4. Changer le mot de passe
5. **Redirection automatique** vers `/platform`

### **3. Test des notifications**

1. Cliquer sur la cloche 🔔 dans le header
2. Voir la notification : "Nouveau client inscrit - Jean Dupont"
3. Cliquer dessus pour la marquer comme lue
4. Le badge disparaît

---

## 📧 Template Email

L'email envoyé contient :

```
🎉 Bienvenue sur Talos Prime !

Bonjour Jean Dupont,

Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !

🔐 Vos identifiants de connexion :
- Email : jean.dupont@example.com
- Mot de passe temporaire : Xk9#mQ2p!vL8

⚠️ IMPORTANT : Vous devrez changer ce mot de passe lors de votre première connexion.

[Se connecter maintenant]

L'équipe Talos Prime
```

---

## 📱 SMS Notifications

### **SMS Utilisateur :**
```
Bienvenue sur Talos Prime ! Votre compte a été créé. 
Consultez votre email pour vos identifiants de connexion.
```

### **SMS Admin (VOUS) :**
```
🎉 Nouveau client inscrit !
Nom : Jean Dupont
Email : jean.dupont@example.com
Tél : +33612345678
```

---

## 🔐 Sécurité

### **Génération du mot de passe :**
- 12 caractères minimum
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (!@#$%^&*)
- Exemple : `Xk9#mQ2p!vL8`

### **Validation à la première connexion :**
- Le middleware vérifie `password_change_required`
- Si `true`, redirige vers `/auth/change-password-required`
- L'utilisateur **ne peut pas** accéder à l'application sans changer son mot de passe

### **Critères du nouveau mot de passe :**
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial

---

## 🔔 Système de Notifications

### **Fonctionnalités :**
- Badge rouge avec compteur de notifications non lues
- Dropdown avec liste des notifications
- Cliquer sur une notification la marque comme lue
- Actualisation automatique toutes les 30 secondes
- Affichage du temps écoulé ("il y a 2 min")

### **Types de notifications :**
- `new_registration` : Nouvel utilisateur inscrit
- `new_lead` : Nouveau lead créé
- (Extensible pour d'autres types)

### **API Endpoints :**
- `GET /api/notifications/admin` - Récupérer les notifications
- `PATCH /api/notifications/admin` - Marquer comme lu
- `POST /api/notifications/admin` - Créer une notification (système)

---

## 📊 Base de Données

### **Table `users` (champ ajouté) :**
```sql
password_change_required BOOLEAN DEFAULT FALSE
```

### **Table `notifications` (nouvelle) :**
```sql
id UUID PRIMARY KEY
user_id UUID (FK vers users)
type VARCHAR(50)
title VARCHAR(255)
message TEXT
data JSONB
read BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
```

---

## 🛠️ Personnalisation

### **Changer le numéro admin pour les SMS :**

Dans N8N, modifier le nœud "SMS Admin (notification)" :
```json
"to": "+33VOTRE_NUMERO"
```

### **Personnaliser l'email :**

Dans N8N, modifier le nœud "Email Utilisateur" :
- Ajouter votre logo
- Changer les couleurs
- Modifier le texte

### **Ajouter d'autres notifications :**

Dans le workflow N8N, ajouter un nœud "HTTP Request" :
- Discord webhook
- Slack webhook
- Telegram bot
- etc.

---

## 🐛 Dépannage

### **Problème : Email non reçu**

✅ **Solution :**
- Vérifier la configuration Resend (clé API)
- Vérifier que l'email est valide
- Regarder les logs N8N : `pm2 logs n8n`

### **Problème : SMS non reçu**

✅ **Solution :**
- Vérifier la configuration Twilio
- Vérifier le format du numéro : `+33XXXXXXXXX`
- Vérifier votre crédit Twilio

### **Problème : Notification in-app non visible**

✅ **Solution :**
- Vérifier que l'utilisateur est bien admin (`user_type = 'admin'`)
- Vérifier que le composant `NotificationBell` est bien ajouté au layout
- Rafraîchir la page

### **Problème : Redirection infinie**

✅ **Solution :**
- Vérifier que le middleware est correctement configuré
- Vérifier que `password_change_required` est bien mis à `false` après le changement

---

## ✅ Checklist de Vérification

Avant de considérer le système comme opérationnel :

- [ ] Migration SQL appliquée
- [ ] Workflow N8N importé et **activé**
- [ ] Numéro admin configuré dans N8N
- [ ] NotificationBell ajouté au layout
- [ ] Application redéployée (`npm run build` + `pm2 restart`)
- [ ] Test d'inscription réussi
- [ ] Email reçu avec mot de passe
- [ ] SMS utilisateur reçu
- [ ] **SMS admin reçu**
- [ ] **Notification in-app visible**
- [ ] Test de connexion avec changement de mot de passe réussi
- [ ] Accès à l'application après changement de mot de passe

---

## 🎯 Résumé

**Vous avez maintenant un système d'inscription automatique complet !**

**Avantages :**
- ✅ Aucune gestion manuelle de mot de passe
- ✅ Sécurité renforcée (changement obligatoire)
- ✅ **Notifications en temps réel** (SMS + in-app)
- ✅ Expérience utilisateur fluide
- ✅ Automatisation complète via N8N

**Pour aller plus loin :**
- Ajoutez une vérification par email (code de vérification)
- Ajoutez une authentification à deux facteurs (2FA)
- Intégrez avec un CRM (HubSpot, Salesforce)
- Ajoutez des analytics (nombre d'inscriptions par jour)

---

## 📝 Notes Importantes

1. **Téléphone obligatoire** : Le format doit commencer par `+33`
2. **Mot de passe temporaire** : Envoyé par email uniquement (pas par SMS)
3. **Notifications admin** : Nécessite que l'utilisateur soit `admin` dans la table `users`
4. **SMS Admin** : Configurez votre numéro dans le workflow N8N

---

Besoin d'aide ? Consultez les logs :
```bash
# Logs N8N
pm2 logs n8n

# Logs Application
pm2 logs talosprime

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

**Tout est prêt ! 🎉**

