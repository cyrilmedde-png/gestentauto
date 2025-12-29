# 🚀 Installation Complète - Système d'Inscription Automatique

## ✅ Corrections Appliquées

- ✅ Fichier SQL corrigé (apostrophes échappées)
- ✅ Imports Supabase corrigés (`createAdminClient` / `createServerClient`)
- ✅ Types TypeScript corrigés (`NextRequest`)
- ✅ **Build OK sans erreurs**

---

## 📦 ÉTAPE 1 : Mise à Jour du VPS

### **1.1. Connexion au VPS**

```bash
ssh root@votre-serveur.com
```

### **1.2. Navigation et Mise à Jour**

```bash
# Aller dans le dossier du projet
cd /var/www/talosprime

# Récupérer les derniers changements
git pull origin main

# Installer les dépendances
npm install

# Build l'application
npm run build

# Redémarrer
pm2 restart talosprime

# Vérifier les logs
pm2 logs talosprime --lines 20
```

**✅ Vous ne devriez voir aucune erreur !**

---

## 🗃️ ÉTAPE 2 : Migration SQL Supabase

### **2.1. Ouvrir Supabase Dashboard**

1. Aller sur : `https://supabase.com/dashboard`
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** dans le menu de gauche

### **2.2. Créer une Nouvelle Requête**

Cliquer sur **"New query"**

### **2.3. Copier-Coller ce Script SQL**

```sql
-- ============================================================================
-- Migration: Système d'inscription automatique avec notifications admin
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

-- 7. Commentaires (documentation)
COMMENT ON TABLE notifications IS 
  'Table pour stocker les notifications des utilisateurs';

COMMENT ON COLUMN notifications.type IS 
  'Type de notification: new_registration, new_lead, etc.';

COMMENT ON COLUMN notifications.data IS 
  'Données JSON supplémentaires associées à la notification';

COMMENT ON COLUMN notifications.read IS 
  'Indique si la notification a été lue par l''utilisateur';

COMMENT ON COLUMN users.password_change_required IS 
  'Indique si l''utilisateur doit changer son mot de passe à la prochaine connexion';

-- Message de succès
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Table notifications créée';
  RAISE NOTICE 'Champ password_change_required ajouté à users';
END $$;
```

### **2.4. Exécuter**

Cliquer sur **"Run"** (ou `Ctrl + Enter`)

**✅ Résultat attendu :**
```
Success. No rows returned
NOTICE:  Migration terminée avec succès !
NOTICE:  Table notifications créée
NOTICE:  Champ password_change_required ajouté à users
```

---

## 🔄 ÉTAPE 3 : Configuration N8N

### **3.1. Récupérer le Fichier JSON**

Sur le VPS :

```bash
cd /var/www/talosprime
cat n8n-workflows/inscription-utilisateur-automatique.json
```

Copiez TOUT le contenu JSON.

### **3.2. Importer dans N8N**

1. Ouvrir : `https://n8n.talosprimes.com`
2. Cliquer sur **"Workflows"** dans le menu
3. Cliquer sur **"Add workflow"**
4. Cliquer sur l'icône **"Import"** (↓)
5. Coller le JSON
6. Cliquer sur **"Import"**

### **3.3. ⚠️ IMPORTANT : Configurer Votre Numéro**

1. Dans le workflow, cliquer sur le nœud **"SMS Admin (notification)"**
2. Dans le champ `to`, **remplacer** `+33VOTRE_NUMERO_ADMIN`
3. Par **votre vrai numéro** : `+33612345678`
4. Cliquer sur **"Save"**

### **3.4. Activer le Workflow**

Cliquer sur le bouton **"Inactive"** en haut à droite → Il devient **"Active"** (vert)

✅ **Le webhook est en écoute !**

---

## 🧪 ÉTAPE 4 : Tests

### **Test 1 : Inscription Via API**

```bash
curl -X POST https://www.talosprimes.com/api/auth/register-simple \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678",
    "company": "ACME Corp"
  }'
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Inscription réussie ! Consultez votre email pour vos identifiants.",
  "user_id": "uuid-ici"
}
```

---

### **Test 2 : Vérifications**

**Email Utilisateur :** `jean.dupont@example.com`
- ✅ Reçoit un email avec le mot de passe temporaire (ex: `Xk9#mQ2p!vL8`)

**SMS Utilisateur :** `+33612345678`
- ✅ Reçoit : "Bienvenue sur Talos Prime ! Consultez votre email..."

**SMS VOUS (Admin) :** `Votre numéro configuré`
- ✅ Reçoit : "🎉 Nouveau client inscrit ! Jean Dupont..."

**In-App (Admin) :**
- ✅ Badge rouge (1) sur la cloche 🔔

---

### **Test 3 : Connexion et Changement de Mot de Passe**

1. Aller sur `https://www.talosprimes.com/auth/login`
2. Se connecter avec l'email et le mot de passe temporaire
3. ✅ **Redirection automatique** vers `/auth/change-password-required`
4. Changer le mot de passe (doit respecter les critères)
5. ✅ **Redirection automatique** vers `/platform`

---

## 📋 Checklist Finale

### **VPS**
- [ ] `git pull origin main` ✅
- [ ] `npm install` ✅
- [ ] `npm run build` ✅ (sans erreurs)
- [ ] `pm2 restart talosprime` ✅

### **Supabase**
- [ ] Migration SQL exécutée ✅
- [ ] Table `notifications` créée ✅
- [ ] Champ `password_change_required` ajouté ✅

### **N8N**
- [ ] Workflow importé ✅
- [ ] **Numéro admin configuré** ✅
- [ ] Workflow activé ✅

### **Tests**
- [ ] Inscription test réussie ✅
- [ ] Email reçu ✅
- [ ] SMS utilisateur reçu ✅
- [ ] **SMS admin reçu** ✅
- [ ] **Notification in-app visible** ✅
- [ ] Connexion + changement mot de passe OK ✅

---

## 🐛 Dépannage

### **Erreur : "Export createClient doesn't exist"**
✅ **Corrigé !** Les imports ont été mis à jour.

### **Erreur SQL : "syntax error at or near 'utilisateur'"**
✅ **Corrigé !** Les apostrophes sont maintenant correctement échappées (`l''utilisateur`).

### **Build échoue avec erreur TypeScript**
✅ **Corrigé !** Les types `NextRequest` sont maintenant utilisés.

### **Workflow N8N ne se déclenche pas**

1. Vérifier que le workflow est **activé** (vert)
2. Vérifier les logs :
```bash
pm2 logs n8n --lines 50
```

### **Email non reçu**

1. Vérifier la configuration Resend dans vos variables d'environnement
2. Vérifier les logs N8N

### **SMS non reçu**

1. Vérifier la configuration Twilio
2. Vérifier le format du numéro : `+33XXXXXXXXX`
3. Vérifier votre crédit Twilio

### **Badge notification non visible**

Ajouter le composant dans votre layout :

```typescript
// app/platform/layout.tsx
import { NotificationBell } from '@/components/notifications/NotificationBell'

<div className="flex items-center gap-4">
  <NotificationBell />
</div>
```

Puis rebuild :
```bash
npm run build && pm2 restart talosprime
```

---

## 📝 Résumé

**Vous avez maintenant :**

1. ✅ Système d'inscription automatique complet
2. ✅ Génération automatique de mot de passe sécurisé
3. ✅ Email + SMS envoyés à l'utilisateur
4. ✅ **SMS + Notification in-app envoyés à l'admin**
5. ✅ Changement de mot de passe obligatoire à la première connexion
6. ✅ Validation téléphone +33 obligatoire
7. ✅ Middleware pour sécuriser l'accès

**Flux complet :**
```
Utilisateur s'inscrit (nom, email, tel)
    ↓
N8N génère mot de passe (Xk9#mQ2p!vL8)
    ↓
    ├─→ 📧 Email utilisateur
    ├─→ 📱 SMS utilisateur
    ├─→ 📱 SMS VOUS
    └─→ 🔔 Notif in-app VOUS
    ↓
Utilisateur se connecte
    ↓
Middleware → force changement mot de passe
    ↓
Accès à l'application
```

---

## 🎯 Prochaine Étape

**Système d'abonnement avec paiements** 💳

Dites-moi quand vous êtes prêt !

---

## 📞 Support

En cas de problème :

```bash
# Logs application
pm2 logs talosprime --lines 50

# Logs N8N
pm2 logs n8n --lines 50

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

**Tout fonctionne ! 🎉**

