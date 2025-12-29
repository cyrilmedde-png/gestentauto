# Guide : Utilisation du workflow N8N pour enregistrer un module

## 📁 Fichier

Le fichier `n8n-workflows/register-module-test.json` contient le workflow N8N complet.

## 🚀 Import dans N8N

### Méthode 1 : Import direct

1. Ouvrir N8N (https://n8n.talosprimes.com)
2. Aller dans **Workflows**
3. Cliquer sur **Import from File**
4. Sélectionner le fichier `n8n-workflows/register-module-test.json`
5. Le workflow apparaît dans votre liste

### Méthode 2 : Copier-coller

1. Ouvrir le fichier `n8n-workflows/register-module-test.json`
2. Copier tout le contenu
3. Dans N8N, cliquer sur **Import from JSON**
4. Coller le contenu
5. Cliquer sur **Import**

---

## ⚙️ Configuration requise

### 1. Remplacement de l'ID utilisateur

**IMPORTANT** : Avant d'utiliser le workflow, vous devez remplacer `REMPLACER_PAR_VOTRE_USER_ID` par votre ID utilisateur plateforme.

**Où trouver votre User ID :**
- Dans Supabase : Table `users`, colonne `id`
- Dans l'application : URL de votre profil ou via l'API

**Comment remplacer :**
1. Ouvrir le workflow dans N8N
2. Cliquer sur le node **"HTTP Request - Enregistrer Module"**
3. Dans **Header Parameters**, trouver `X-User-Id`
4. Remplacer `REMPLACER_PAR_VOTRE_USER_ID` par votre User ID
5. Sauvegarder

### 2. Vérifier l'URL de l'API

Le workflow utilise : `https://www.talosprimes.com/api/platform/n8n/modules/register`

Si votre domaine est différent, modifiez l'URL dans le node **"HTTP Request - Enregistrer Module"**.

---

## 📝 Personnalisation des données du module

Pour créer un module différent, modifiez les valeurs dans le node **"Set - Données Module"** :

### Champs disponibles :

- **name** : Nom technique du module (slug, minuscules, tirets uniquement)
  - Exemple : `test-module`, `commandes`, `factures-auto`

- **display_name** : Nom affiché dans l'interface
  - Exemple : `Module Test`, `Module Commandes`

- **description** : Description du module
  - Exemple : `Module de test créé depuis N8N`

- **price_monthly** : Prix mensuel en euros
  - Exemple : `19.99`, `29.99`, `39.99`

- **icon** : Nom de l'icône Lucide (sans "Icon" à la fin)
  - Exemples : `Package`, `ShoppingCart`, `FileText`, `Users`
  - Liste complète : https://lucide.dev/icons/

- **category** : Catégorie du module
  - Valeurs possibles : `base`, `premium`, `custom`

- **features** : Liste des fonctionnalités (JSON array)
  - Exemple : `["Fonctionnalité 1", "Fonctionnalité 2"]`

- **n8n_workflow_id** : ID du workflow N8N (généré automatiquement)
  - Laisser : `={{ $workflow.id }}`

- **route_slug** : Slug pour l'URL (généralement identique à `name`)
  - Exemple : `test-module`, `commandes`

- **table_name** : Nom de la table Supabase (optionnel)
  - Exemple : `workflow_test_module`, `workflow_commandes`

### Exemple : Créer un module "Commandes"

Dans le node **"Set - Données Module"**, remplacer :

```json
{
  "name": "commandes",
  "display_name": "Module Commandes",
  "description": "Gestion des commandes clients",
  "price_monthly": "39.99",
  "icon": "ShoppingCart",
  "category": "custom",
  "features": "[\"Création commandes\", \"Suivi livraison\", \"Facturation\"]",
  "route_slug": "commandes",
  "table_name": "workflow_commandes"
}
```

---

## 🧪 Tester le workflow

### 1. Activer le workflow

1. Ouvrir le workflow dans N8N
2. Cliquer sur le bouton **Active** (en haut à droite)
3. Le workflow devient actif

### 2. Tester avec le Webhook

**Option A : Via l'interface N8N**
1. Cliquer sur le node **Webhook**
2. Cliquer sur **Listen for Test Event**
3. Cliquer sur **Test Workflow**
4. Vérifier la réponse dans **Respond to Webhook**

**Option B : Via curl (ligne de commande)**
```bash
curl -X POST https://n8n.talosprimes.com/webhook/register-module \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Vérifier le résultat

**Succès :**
```json
{
  "message": "✅ Module enregistré avec succès !",
  "module": {
    "id": "...",
    "name": "test-module",
    "display_name": "Module Test",
    ...
  },
  "statusCode": 200
}
```

**Erreur :**
```json
{
  "message": "❌ Erreur: ...",
  "details": "...",
  "statusCode": 400
}
```

---

## ✅ Vérification après enregistrement

### Dans Supabase SQL Editor :

```sql
-- Vérifier que le module a été créé
SELECT 
  name,
  display_name,
  price_monthly,
  category,
  is_n8n_created,
  route_slug
FROM available_modules
WHERE name = 'test-module';
```

### Dans l'application :

1. Se connecter à https://www.talosprimes.com
2. Aller sur `/platform/subscriptions`
3. Vérifier que le nouveau module apparaît dans la liste
4. Aller sur `/platform/workflows/test-module` (si route_slug = "test-module")

---

## 🔧 Dépannage

### Erreur 403 : "Non autorisé - Plateforme uniquement"

**Cause :** L'utilisateur spécifié dans `X-User-Id` n'est pas un admin plateforme.

**Solution :**
1. Vérifier que l'utilisateur a le `company_id` correspondant à la plateforme
2. Vérifier dans la table `settings` que `platform_company_id` est bien défini
3. Utiliser un autre User ID qui est admin plateforme

### Erreur 400 : "Champs requis manquants"

**Cause :** Un des champs requis (`name`, `display_name`, `price_monthly`) est manquant.

**Solution :** Vérifier que tous les champs sont remplis dans le node "Set - Données Module"

### Erreur 409 : "Un module avec ce nom existe déjà"

**Cause :** Un module avec le même `name` existe déjà dans `available_modules`.

**Solution :**
1. Utiliser un autre `name` pour le module
2. Ou supprimer l'ancien module dans Supabase :
   ```sql
   DELETE FROM available_modules WHERE name = 'test-module';
   ```

### Erreur de connexion HTTP

**Cause :** L'URL de l'API est incorrecte ou le serveur est inaccessible.

**Solution :**
1. Vérifier que l'URL `https://www.talosprimes.com` est correcte
2. Vérifier que l'application est accessible
3. Vérifier les logs du serveur

---

## 📚 Ressources

- **API Documentation** : `/api/platform/n8n/modules/register`
- **Fichier source** : `app/api/platform/n8n/modules/register/route.ts`
- **Icônes Lucide** : https://lucide.dev/icons/
- **N8N Documentation** : https://docs.n8n.io/




