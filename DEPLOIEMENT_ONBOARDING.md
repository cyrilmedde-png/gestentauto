# 🚀 Déploiement du Système d'Onboarding

## ✅ Ce Qui a Été Fait

### **1. APIs Créées**
- ✅ `/api/auth/register-lead` - Pré-inscription de leads
- ✅ `/api/platform/trials/create` - Création d'essais gratuits

### **2. Interfaces Modifiées**
- ✅ `/auth/register` - Page d'inscription publique (pré-inscription)
- ✅ `/platform/leads` - Ajout du bouton "Créer essai"
- ✅ Composant `CreateTrialModal` - Modal de création d'essai

### **3. Workflows N8N Créés**
- ✅ `inscription-lead.json` - Notifications pré-inscription
- ✅ `creer-essai.json` - Envoi identifiants essai

### **4. Fichiers Supprimés (Nettoyage)**
- ❌ `/api/auth/create-user-with-password` (obsolète)
- ❌ `/api/auth/register-simple` (remplacé par register-lead)
- ❌ `inscription-utilisateur-automatique.json` (remplacé)

---

## 📋 Instructions de Déploiement

### **ÉTAPE 1 : Déployer sur le VPS**

```bash
# Sur le VPS
ssh root@82.165.129.143
cd /var/www/talosprime

# Récupérer les changements
git pull origin main

# Vérifier les fichiers modifiés
git log --oneline -5

# Installer les dépendances (si nouvelles)
npm install

# Build l'application
npm run build

# Redémarrer l'application
pm2 restart talosprime

# Vérifier les logs
pm2 logs talosprime --lines 50
```

---

### **ÉTAPE 2 : Importer les Workflows N8N**

**Sur https://n8n.talosprimes.com** :

#### **A. Supprimer l'ancien workflow (si existant)**
1. Connectez-vous à N8N
2. Si vous voyez "Inscription Utilisateur Automatique"
   - Cliquez dessus
   - Cliquer sur "..." → "Delete"
   - Confirmer

#### **B. Importer le workflow "Inscription Lead"**
1. Cliquer sur "+" → "Import from File"
2. Sélectionner : `n8n-workflows/inscription-lead.json`
3. Cliquer sur "Import"
4. **IMPORTANT** : Cliquer sur le bouton en haut à droite pour **ACTIVER** (doit être VERT)
5. Cliquer sur "Save"

#### **C. Importer le workflow "Créer Essai"**
1. Cliquer sur "+" → "Import from File"
2. Sélectionner : `n8n-workflows/creer-essai.json`
3. Cliquer sur "Import"
4. **IMPORTANT** : Cliquer sur le bouton en haut à droite pour **ACTIVER** (doit être VERT)
5. Cliquer sur "Save"

#### **D. Vérifier les Webhooks**
1. Pour chaque workflow, vérifier que le webhook est bien configuré :
   - **Inscription Lead** : `https://n8n.talosprimes.com/webhook/inscription-lead`
   - **Créer Essai** : `https://n8n.talosprimes.com/webhook/creer-essai`

---

### **ÉTAPE 3 : Tests**

#### **Test 1 : Pré-inscription**
```bash
# Test de pré-inscription
curl -X POST https://www.talosprimes.com/api/auth/register-lead \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "ONBOARDING",
    "email": "test.onboarding@example.com",
    "phone": "+33600000123",
    "company": "Test Company"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Merci pour votre intérêt ! Nous vous contacterons sous 24h...",
  "lead_id": "xxx-xxx-xxx"
}
```

**Vérifications** :
1. Sur Supabase → `platform_leads` → Nouveau lead créé
2. Email bienvenue reçu
3. SMS reçu au +33600000123
4. SMS admin reçu au +33766658863
5. Notification in-app visible

#### **Test 2 : Interface d'inscription**
1. Aller sur `https://www.talosprimes.com/auth/register`
2. Remplir le formulaire :
   ```
   Prénom : Sophie
   Nom : MARTIN
   Email : sophie.martin.test@example.com
   Téléphone : +33612345678
   Entreprise : Test Entreprise
   ```
3. Cliquer sur "S'inscrire"
4. Vérifier le message de succès
5. Vérifier que le lead est dans `platform_leads`

#### **Test 3 : Création d'essai**
1. Aller sur `https://www.talosprimes.com/platform/leads`
2. Trouver le lead créé (sophie.martin.test@example.com)
3. Cliquer sur "Modifier"
4. Changer le statut en "questionnaire_completed"
5. Sauvegarder
6. Actualiser la page
7. Le bouton "🚀 Créer essai" devrait apparaître
8. Cliquer dessus
9. Configurer :
   - Durée : 14 jours
   - Modules : CRM, Clients, Facturation
10. Cliquer sur "Créer l'essai"
11. Vérifier les identifiants affichés
12. Copier le mot de passe

**Vérifications** :
1. Essai créé dans `platform_trials`
2. Company créée dans `companies`
3. User créé dans `users`
4. Compte créé dans `auth.users`
5. Email identifiants reçu
6. SMS reçu
7. Le client peut se connecter avec les identifiants

#### **Test 4 : Connexion du Client**
1. Aller sur `https://www.talosprimes.com/auth/login`
2. Se connecter avec :
   - Email : `sophie.martin.test@example.com`
   - Mot de passe : (celui affiché dans le modal)
3. Vérifier l'accès au dashboard
4. Vérifier les modules activés

---

### **ÉTAPE 4 : Vérifier les Logs**

```bash
# Sur le VPS
pm2 logs talosprime --lines 100 | grep -E "(✅|❌|🚀|📧|📱)"
```

**Logs attendus** :
```
📝 Nouvelle pré-inscription lead: { first_name, last_name, email, phone, company }
✨ Création du lead dans platform_leads...
✅ Lead créé avec succès: xxx-xxx-xxx
🔄 Appel du workflow N8N inscription-lead...
✅ Workflow N8N déclenché avec succès
```

---

## 🔍 Troubleshooting

### **Problème 1 : "Le workflow N8N n'a pas pu être contacté"**
**Cause** : Workflow N8N non activé ou N8N hors ligne

**Solution** :
1. Vérifier que N8N est en ligne : `https://n8n.talosprimes.com`
2. Vérifier que les workflows sont **ACTIVÉS** (bouton vert)
3. Tester le webhook manuellement :
   ```bash
   curl -X POST https://n8n.talosprimes.com/webhook/inscription-lead \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"TEST","email":"test@test.com","phone":"+33600000000"}'
   ```

### **Problème 2 : "Cet email est déjà enregistré"**
**Cause** : Email déjà utilisé

**Solution** :
1. Vérifier dans Supabase → `platform_leads` si l'email existe
2. Si oui, utiliser un autre email pour le test
3. Ou supprimer le lead existant

### **Problème 3 : Erreur "Could not find the 'phone' column"**
**Cause** : Migration SQL non appliquée

**Solution** :
```bash
# Sur le VPS
cd /var/www/talosprime
npx supabase db push
```

Ou appliquer manuellement dans Supabase SQL Editor :
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
```

### **Problème 4 : Le bouton "Créer essai" n'apparaît pas**
**Cause** : Le statut du lead n'est pas correct

**Solution** :
Le bouton n'apparaît que pour les leads avec statut :
- `questionnaire_completed`
- `interview_scheduled`

Modifier le statut du lead dans l'interface d'édition.

---

## 📊 Checklist de Déploiement

- [ ] Code pushé sur GitHub
- [ ] `git pull` sur le VPS
- [ ] `npm run build` réussi
- [ ] `pm2 restart talosprime` effectué
- [ ] Workflow "Inscription Lead" importé et activé
- [ ] Workflow "Créer Essai" importé et activé
- [ ] Test pré-inscription OK (API)
- [ ] Test inscription interface OK
- [ ] Test création essai OK
- [ ] Test connexion client OK
- [ ] Emails reçus
- [ ] SMS reçus
- [ ] Notifications in-app visibles
- [ ] Logs VPS propres (pas d'erreur)

---

## 🎯 Résultat Final

Après déploiement, vous aurez :

✅ **Page publique d'inscription** qui crée des leads (pas de comptes)
✅ **Interface admin** pour gérer les leads
✅ **Bouton "Créer essai"** qui génère automatiquement :
  - Mot de passe sécurisé
  - Compte client complet
  - Email avec identifiants
  - SMS de confirmation
✅ **Notifications automatiques** à chaque étape
✅ **Workflow d'onboarding** entièrement fonctionnel

---

**🚀 Bon déploiement !**

