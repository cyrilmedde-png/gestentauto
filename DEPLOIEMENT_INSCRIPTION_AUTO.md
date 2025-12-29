# 🚀 Guide de Déploiement - Système d'Inscription Automatique

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Étape 1 : Mise à jour du VPS](#étape-1--mise-à-jour-du-vps)
3. [Étape 2 : Migration SQL Supabase](#étape-2--migration-sql-supabase)
4. [Étape 3 : Configuration N8N](#étape-3--configuration-n8n)
5. [Étape 4 : Build et Redémarrage](#étape-4--build-et-redémarrage)
6. [Étape 5 : Tests](#étape-5--tests)
7. [Dépannage](#dépannage)

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :
- [ ] Accès SSH au VPS
- [ ] Accès à Supabase Dashboard
- [ ] Accès à N8N (`https://n8n.talosprimes.com`)
- [ ] Votre numéro de téléphone admin (format +33XXXXXXXXX)

---

## 🔄 Étape 1 : Mise à jour du VPS

### **1.1. Connexion au VPS**

```bash
ssh root@votre-serveur.com
```

### **1.2. Aller dans le dossier du projet**

```bash
cd /var/www/talosprime
```

### **1.3. Récupérer les derniers changements**

```bash
git pull origin main
```

**Sortie attendue :**
```
remote: Enumerating objects: XX, done.
remote: Counting objects: 100% (XX/XX), done.
remote: Compressing objects: 100% (XX/XX), done.
remote: Total XX (delta XX), reused XX (delta XX)
Unpacking objects: 100% (XX/XX), done.
From github.com:cyrilmedde-png/gestentauto
   abbcdff..fc11dfb  main -> main
Updating abbcdff..fc11dfb
Fast-forward
 12 files changed, 2260 insertions(+)
```

✅ **Vérification :** Les nouveaux fichiers sont téléchargés

---

## 🗃️ Étape 2 : Migration SQL Supabase

### **2.1. Ouvrir Supabase Dashboard**

1. Aller sur : `https://supabase.com/dashboard`
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (menu de gauche)

### **2.2. Créer une nouvelle requête**

Cliquer sur **"New query"**

### **2.3. Copier-coller le script SQL**

Copier tout le contenu du fichier :
**`supabase/migrations/20250129_inscription_automatique.sql`**

Ou copier directement depuis ici :

```sql
-- ============================================================================
-- Migration: Système d'inscription automatique avec notifications admin
-- Date: 2025-01-29
-- Description: Ajoute le système de changement de mot de passe obligatoire
--              et les notifications pour les admins
-- ============================================================================

-- 1. Ajouter le champ password_change_required à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT FALSE;

-- 2. Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- 4. Activer Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Créer les policies RLS pour notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- 6. Créer une fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;
END;
$$;

-- 7. Ajouter des commentaires pour la documentation
COMMENT ON TABLE notifications IS 
  'Table pour stocker les notifications des utilisateurs';

COMMENT ON COLUMN notifications.user_id IS 
  'ID de l''utilisateur destinataire de la notification';

COMMENT ON COLUMN notifications.type IS 
  'Type de notification: new_registration, new_lead, etc.';

COMMENT ON COLUMN notifications.data IS 
  'Données JSON supplémentaires associées à la notification';

COMMENT ON COLUMN notifications.read IS 
  'Indique si la notification a été lue par l''utilisateur';

COMMENT ON COLUMN users.password_change_required IS 
  'Indique si l''utilisateur doit changer son mot de passe à la prochaine connexion';

-- 8. Afficher un message de succès
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Table notifications créée';
  RAISE NOTICE 'Champ password_change_required ajouté à users';
  RAISE NOTICE 'Policies RLS configurées';
END $$;
```

### **2.4. Exécuter la migration**

Cliquer sur **"Run"** (ou `Ctrl + Enter`)

**Sortie attendue :**
```
Success. No rows returned
NOTICE:  Migration terminée avec succès !
NOTICE:  Table notifications créée
NOTICE:  Champ password_change_required ajouté à users
NOTICE:  Policies RLS configurées
```

✅ **Vérification :** Aller dans **Table Editor** → Vous devriez voir la table `notifications`

---

## 🔄 Étape 3 : Configuration N8N

### **3.1. Ouvrir N8N**

Aller sur : `https://n8n.talosprimes.com`

### **3.2. Importer le workflow**

1. Cliquer sur **"Workflows"** dans le menu de gauche
2. Cliquer sur **"Add workflow"**
3. Cliquer sur **"Import from file"** (icône vers le bas)
4. Sur votre VPS, récupérer le fichier :

```bash
# Sur le VPS
cd /var/www/talosprime
cat n8n-workflows/inscription-utilisateur-automatique.json
```

5. Copier tout le contenu JSON
6. Dans N8N, coller le JSON dans la zone de texte
7. Cliquer sur **"Import"**

### **3.3. Configurer votre numéro de téléphone admin**

1. Dans le workflow importé, cliquer sur le nœud **"SMS Admin (notification)"**
2. Dans le champ `to`, remplacer `+33VOTRE_NUMERO_ADMIN` par **votre vrai numéro**
   - Exemple : `+33612345678`
3. Cliquer sur **"Save"**

### **3.4. Vérifier les URLs**

Vérifier que toutes les URLs sont correctes :

- **Nœud "Créer Utilisateur"** : `https://www.talosprimes.com/api/auth/create-user-with-password`
- **Nœud "Email Utilisateur"** : `https://www.talosprimes.com/api/email/send`
- **Nœud "SMS Utilisateur"** : `https://www.talosprimes.com/api/sms/send`
- **Nœud "SMS Admin"** : `https://www.talosprimes.com/api/sms/send`
- **Nœud "Notification In-App Admin"** : `https://www.talosprimes.com/api/notifications/admin`

### **3.5. Activer le workflow**

1. Cliquer sur le bouton **"Inactive"** en haut à droite
2. Le bouton devient **"Active"** (vert)

✅ **Vérification :** Le webhook est maintenant en écoute sur `/webhook/inscription-utilisateur`

---

## 🛠️ Étape 4 : Build et Redémarrage

### **4.1. Installer les dépendances**

```bash
# Sur le VPS
cd /var/www/talosprime
npm install
```

### **4.2. Build de l'application**

```bash
npm run build
```

**Sortie attendue :**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Finalizing page optimization
```

### **4.3. Redémarrer l'application**

```bash
pm2 restart talosprime
```

**Sortie attendue :**
```
[PM2] Applying action restartProcessId on app [talosprime](ids: [ 1 ])
[PM2] [talosprime](1) ✓
```

### **4.4. Vérifier les logs**

```bash
pm2 logs talosprime --lines 20
```

Vous ne devriez voir **aucune erreur**.

✅ **Vérification :** L'application redémarre sans erreur

---

## 🧪 Étape 5 : Tests

### **Test 1 : Vérifier que la page d'inscription existe**

```bash
curl -I https://www.talosprimes.com/auth/register-simple
```

**Sortie attendue :**
```
HTTP/2 200
```

✅ La page existe

---

### **Test 2 : Tester l'inscription via l'API**

```bash
curl -X POST https://www.talosprimes.com/api/auth/register-simple \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "+33612345678",
    "company": "Test Corp"
  }'
```

**Sortie attendue :**
```json
{
  "success": true,
  "message": "Inscription réussie ! Consultez votre email pour vos identifiants.",
  "user_id": "uuid-ici"
}
```

✅ L'inscription fonctionne

---

### **Test 3 : Vérifier l'email**

1. Consulter l'email de test : `test@example.com`
2. Vous devriez avoir reçu un email avec :
   - Sujet : "Bienvenue sur Talos Prime - Vos identifiants"
   - Contenu : Mot de passe temporaire (ex: `Xk9#mQ2p!vL8`)

✅ L'email est envoyé

---

### **Test 4 : Vérifier le SMS utilisateur**

Le numéro `+33612345678` devrait recevoir :
```
Bienvenue sur Talos Prime ! Votre compte a été créé. 
Consultez votre email pour vos identifiants de connexion.
```

✅ Le SMS utilisateur est envoyé

---

### **Test 5 : Vérifier le SMS admin (VOUS)**

**VOUS** devriez recevoir un SMS sur votre numéro configuré :
```
🎉 Nouveau client inscrit !
Nom : Test User
Email : test@example.com
Tél : +33612345678
```

✅ Le SMS admin est envoyé

---

### **Test 6 : Vérifier la notification in-app**

1. Se connecter à l'application en tant qu'admin
2. Regarder la cloche 🔔 dans le header
3. Vous devriez voir un badge rouge avec **"1"**
4. Cliquer sur la cloche
5. Vous devriez voir : "Nouveau client inscrit - Test User"

✅ La notification in-app fonctionne

---

### **Test 7 : Tester la connexion et le changement de mot de passe**

1. Aller sur `https://www.talosprimes.com/auth/login`
2. Se connecter avec :
   - Email : `test@example.com`
   - Mot de passe : (celui reçu par email)
3. **Vous devriez être redirigé automatiquement** vers `/auth/change-password-required`
4. Changer le mot de passe (nouveau mot de passe doit respecter les critères)
5. **Vous devriez être redirigé automatiquement** vers `/platform`

✅ Le système de changement de mot de passe obligatoire fonctionne

---

## 🎯 Checklist Complète

- [ ] VPS mis à jour (`git pull`)
- [ ] Migration SQL exécutée dans Supabase
- [ ] Table `notifications` créée
- [ ] Champ `password_change_required` ajouté à `users`
- [ ] Workflow N8N importé
- [ ] **Numéro admin configuré** dans N8N
- [ ] Workflow N8N **activé**
- [ ] Application buildée (`npm run build`)
- [ ] Application redémarrée (`pm2 restart talosprime`)
- [ ] Test d'inscription réussi
- [ ] Email reçu avec mot de passe
- [ ] SMS utilisateur reçu
- [ ] **SMS admin reçu** ✅
- [ ] **Notification in-app visible** ✅
- [ ] Test de connexion avec changement de mot de passe réussi

---

## 🐛 Dépannage

### **Problème : Migration SQL échoue**

**Erreur :** `relation "users" does not exist`

**Solution :** La table `users` n'existe pas. Vérifiez votre schéma de base de données.

---

### **Problème : Workflow N8N ne se déclenche pas**

**Solution :**
1. Vérifier que le workflow est **activé** (bouton vert "Active")
2. Vérifier les logs N8N : `pm2 logs n8n`
3. Tester le webhook directement :
```bash
curl -X POST https://n8n.talosprimes.com/webhook/inscription-utilisateur \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com","phone":"+33612345678"}'
```

---

### **Problème : Email non reçu**

**Solution :**
1. Vérifier la configuration Resend dans vos variables d'environnement
2. Vérifier les logs N8N pour voir l'erreur
3. Tester l'API email directement :
```bash
curl -X POST https://www.talosprimes.com/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

---

### **Problème : SMS non reçu**

**Solution :**
1. Vérifier la configuration Twilio
2. Vérifier le format du numéro (doit commencer par +33)
3. Vérifier votre crédit Twilio

---

### **Problème : Badge notification non visible**

**Solution :**
1. Vérifier que vous êtes bien admin (`user_type = 'admin'` dans la table `users`)
2. Ajouter le composant `NotificationBell` dans votre layout :

```typescript
// app/platform/layout.tsx
import { NotificationBell } from '@/components/notifications/NotificationBell'

<div className="flex items-center gap-4">
  <NotificationBell />
  {/* ... */}
</div>
```

3. Rebuild : `npm run build && pm2 restart talosprime`

---

### **Problème : Redirection infinie sur change-password-required**

**Solution :**
1. Vérifier que le middleware est bien présent (`middleware.ts`)
2. Vérifier que l'API `/api/auth/change-password` met bien à jour le champ `password_change_required` à `false`

---

## 📞 Support

En cas de problème, vérifier les logs :

```bash
# Logs application
pm2 logs talosprime --lines 50

# Logs N8N
pm2 logs n8n --lines 50

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Félicitations !

**Votre système d'inscription automatique est maintenant opérationnel ! 🎉**

Les nouveaux utilisateurs peuvent s'inscrire en quelques secondes, et vous recevez une notification instantanée par SMS et dans l'application !

**Prochaine étape : Système d'abonnement** 💳

