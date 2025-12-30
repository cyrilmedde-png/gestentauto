# 🚨 RÉIMPORTER LE WORKFLOW N8N (URGENT)

## ⚠️ Problème Actuel

Le workflow N8N sur le serveur est **l'ancienne version** qui ne fonctionne pas correctement.

**Symptômes** :
- Réponse N8N vide
- Aucun utilisateur créé dans la base de données
- Pas d'email envoyé
- Pas de SMS envoyé

---

## ✅ Solution : Réimporter le Workflow

### **Étape 1 : Supprimer l'Ancien Workflow**

1. Allez sur **https://n8n.talosprimes.com**
2. Connectez-vous
3. Cliquez sur le workflow **"Inscription Utilisateur Automatique"**
4. En haut à droite, cliquez sur **"..."** (trois points)
5. Cliquez sur **"Delete"**
6. Confirmez la suppression

---

### **Étape 2 : Télécharger le Nouveau Workflow**

**Sur votre Mac** :

Le fichier se trouve ici :
```
gestion complete automatiser/n8n-workflows/inscription-utilisateur-automatique.json
```

Téléchargez-le depuis GitHub ou utilisez le fichier local.

---

### **Étape 3 : Importer le Nouveau Workflow**

1. Sur **https://n8n.talosprimes.com**
2. Cliquez sur le **"+"** en haut à gauche
3. Cliquez sur **"Import from File"**
4. Sélectionnez le fichier : `inscription-utilisateur-automatique.json`
5. Cliquez sur **"Import"**

---

### **Étape 4 : Vérifier la Configuration**

1. **Nœud "Webhook Inscription"** :
   - Path : `inscription-utilisateur`
   - Méthode : `POST`
   - Response Mode : `responseNode`

2. **Nœud "Créer Utilisateur"** :
   - URL : `https://www.talosprimes.com/api/auth/create-user-with-password`
   - Méthode : `POST`
   - Body Parameters : `email`, `password`, `first_name`, `last_name`, `phone`, `company`, `password_change_required`

3. **Nœud "Réponse Succès"** :
   - Response Body :
   ```json
   {
     "success": true,
     "message": "Inscription réussie. Consultez votre email pour vos identifiants."
   }
   ```
   - **PAS de référence** à `$node["Créer Utilisateur"].json.user_id`

---

### **Étape 5 : ACTIVER le Workflow**

**TRÈS IMPORTANT** :

1. En haut à droite, le bouton doit être **vert** avec "Active"
2. Si le bouton est gris "Inactive", **cliquez dessus** pour l'activer

---

### **Étape 6 : Tester**

1. Allez sur **https://www.talosprimes.com/auth/register**

2. Remplissez avec un **NOUVEL EMAIL** (pas `arnaudanais23@gmail.com` déjà utilisé) :
   ```
   Prénom: Test
   Nom: WORKFLOW
   Email: test.workflow.new@example.com
   Téléphone: +33600000002
   Entreprise: Test Workflow Import
   ```

3. Cliquez sur **"S'inscrire"**

4. Vérifiez les logs :
   ```bash
   ssh root@votre-serveur.com
   pm2 logs talosprime --lines 50
   ```

5. **Logs attendus** :
   ```
   🔐 Création utilisateur Auth...
   ✅ Utilisateur Auth créé: xxx-xxx-xxx
   🏢 Création de la company...
   ✅ Company créée: xxx-xxx-xxx
   👑 Création du rôle Propriétaire...
   ✅ Rôle créé: xxx-xxx-xxx
   👤 Création utilisateur dans table users...
   ✅ Utilisateur créé avec succès !
   📝 Réponse brute N8N: {"success":true,"message":"..."}
   ✅ Workflow N8N exécuté avec succès
   ```

---

## 🔍 Comment Vérifier que Ça Marche

### **1. Dans les Logs VPS**

**Avant (ancien workflow)** :
```
📝 Réponse brute N8N: 
⚠️ Réponse N8N vide
```

**Après (nouveau workflow)** :
```
📝 Réponse brute N8N: {"success":true,"message":"Inscription réussie..."}
✅ Données N8N reçues: { success: true, message: '...' }
```

### **2. Dans Supabase**

Vérifiez que le nouvel utilisateur apparaît dans :
- **Authentication** → **Users**
- **Table Editor** → **users**
- **Table Editor** → **companies**
- **Table Editor** → **roles**

### **3. Emails et SMS**

- Utilisateur reçoit email avec mot de passe
- Utilisateur reçoit SMS de bienvenue
- Admin reçoit SMS de notification

---

## ❌ Si Ça Ne Marche Toujours Pas

Vérifiez dans N8N les **executions** du workflow :

1. Sur **https://n8n.talosprimes.com**
2. Ouvrez le workflow
3. En bas, cliquez sur **"Executions"**
4. Regardez la dernière exécution :
   - **Success** (vert) = Bon
   - **Error** (rouge) = Cliquez dessus pour voir l'erreur

---

## 📋 Checklist Finale

- [ ] Ancien workflow supprimé
- [ ] Nouveau workflow importé depuis `inscription-utilisateur-automatique.json`
- [ ] Workflow **ACTIVÉ** (bouton vert)
- [ ] Nœud "Réponse Succès" vérifié (pas de référence `user_id`)
- [ ] Test d'inscription avec un nouvel email
- [ ] Logs VPS montrent la création complète
- [ ] Utilisateur créé dans Supabase
- [ ] Email et SMS reçus

---

**Une fois ces étapes faites, l'inscription fonctionnera à 100% ! 🚀**

