# Création du compte Super Admin de la plateforme

## Instructions

### Prérequis

⚠️ **IMPORTANT** : L'utilisateur doit d'abord exister dans Supabase Auth avant d'exécuter ce script.

1. **Option 1** : L'utilisateur s'inscrit normalement via `/auth/register`
2. **Option 2** : Créer l'utilisateur manuellement dans Supabase Dashboard :
   - Aller dans **Authentication > Users**
   - Cliquer sur **Add user**
   - Email : `groupemclem@gmail.com`
   - Password : (définir un mot de passe)
   - Auto Confirm User : ✅ (pour éviter la confirmation email)

### Étapes

1. **Ouvrir Supabase SQL Editor**
   - Aller dans Supabase Dashboard
   - Cliquer sur **SQL Editor** dans le menu de gauche

2. **Exécuter le script**
   - Ouvrir le fichier `database/create_platform_admin.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL
   - Cliquer sur **Run** ou `Ctrl/Cmd + Enter`

3. **Vérifier le résultat**
   - Le script affiche des messages de succès dans les logs
   - La dernière requête SELECT affiche les informations créées
   - Vous devriez voir :
     - Company ID
     - Company Name : "Groupe MCLEM"
     - User ID (correspondant à l'email groupemclem@gmail.com)
     - Role Name : "Super Admin"

### Informations créées

**Entreprise Plateforme** :
- Nom : Groupe MCLEM
- Email : groupemclem@gmail.com
- Téléphone : 0789394806
- Adresse : 38 avenue Leon Blum, 30200 Bagnols sur ceze
- Pays : FR
- TVA : FR53907790745
- SIRET : 90779074500018

**Rôle Super Admin** :
- Permissions complètes sur la plateforme
- Ne peut pas supprimer la plateforme elle-même (protection)
- Accès à tous les modules
- Gestion complète des clients

**Settings créés** :
- `platform_company_id` : Identifie cette entreprise comme la plateforme système
- `is_platform` : Flag pour protéger cette entreprise de la suppression

### Protection contre la suppression

Le script marque la plateforme avec :
1. Un setting `platform_company_id` qui identifie cette entreprise
2. Un setting `is_platform: true` pour protection supplémentaire
3. Les permissions du Super Admin empêchent la suppression de la plateforme (`"delete": false` dans les permissions platform)

### Vérification après exécution

1. Se connecter avec `groupemclem@gmail.com` et votre mot de passe
2. Aller sur `/settings` → onglet "Plateforme"
3. Vous devriez voir toutes les informations de "Groupe MCLEM" affichées

### En cas d'erreur

**Erreur "Utilisateur non trouvé"** :
- L'utilisateur n'existe pas encore dans auth.users
- Créer l'utilisateur d'abord (voir Prérequis ci-dessus)
- Ou modifier l'email dans le script si vous utilisez un autre email

**Erreur de contrainte** :
- L'entreprise existe peut-être déjà
- Le script met à jour l'entreprise existante automatiquement
- Vérifier avec la requête SELECT à la fin du script









