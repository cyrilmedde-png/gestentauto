# 🚀 Connecter le projet à Vercel

## 🎯 Guide étape par étape

### Étape 1 : Créer un compte Vercel

1. Allez sur **https://vercel.com/signup**
2. Cliquez sur **"Continue with GitHub"** (recommandé)
3. Autorisez Vercel à accéder à votre compte GitHub

### Étape 2 : Importer votre projet

1. Une fois connecté, cliquez sur **"Add New Project"** ou **"Import Project"**
2. Vercel va lister vos dépôts GitHub
3. Cherchez **`gestentauto`** (ou `cyrilmedde-png/gestentauto`)
4. Cliquez sur **"Import"**

### Étape 3 : Configuration du projet

Vercel détectera automatiquement Next.js. Vérifiez les paramètres :

**Project Name** : `gestentauto` (ou votre choix)

**Framework Preset** : Next.js (détecté automatiquement)

**Root Directory** : `./` (laisser par défaut)

**Build Command** : `npm run build` (détecté automatiquement)

**Output Directory** : `.next` (détecté automatiquement)

**Install Command** : `npm install` (détecté automatiquement)

### Étape 4 : Configurer les variables d'environnement

⚠️ **IMPORTANT** : Avant de déployer, configurez les variables d'environnement !

Dans la section **"Environment Variables"**, ajoutez :

#### Variables pour Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://lkzfmialjaryobminfbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_public
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@db.lkzfmialjaryobminfbg.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
NODE_ENV=production
```

#### Variables pour Preview/Development

Les mêmes variables, mais avec :
```env
NEXT_PUBLIC_APP_URL=https://votre-app-git-main-cyrilmedde-png.vercel.app
NODE_ENV=development
```

**Comment ajouter** :
1. Cliquez sur **"Environment Variables"**
2. Pour chaque variable :
   - **Name** : Le nom de la variable (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value** : La valeur de la variable
   - **Environments** : Cochez **Production**, **Preview**, et **Development**
3. Cliquez sur **"Add"**
4. Répétez pour toutes les variables

### Étape 5 : Déployer

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Installer les dépendances
   - Builder l'application
   - Déployer sur leur infrastructure
3. Attendez 2-3 minutes

### Étape 6 : Vérifier le déploiement

Une fois terminé, vous obtiendrez :
- **URL de production** : `https://gestentauto.vercel.app` (ou similaire)
- **URL de preview** : Pour chaque commit/PR

## 🔄 Déploiements automatiques

Une fois connecté, Vercel déploiera automatiquement :

- **Production** : À chaque push sur la branche `main`
- **Preview** : À chaque Pull Request ou push sur d'autres branches

## ⚙️ Configuration Supabase pour Vercel

Après le déploiement, vous devez mettre à jour Supabase :

1. Allez dans **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Ajoutez dans **Site URL** :
   ```
   https://gestentauto.vercel.app
   ```
3. Ajoutez dans **Redirect URLs** :
   ```
   https://gestentauto.vercel.app/**
   https://gestentauto-*.vercel.app
   ```
   (Cela permet les preview deployments)

## 📊 Monitoring

Dans Vercel Dashboard, vous pouvez :
- Voir les logs de déploiement
- Voir les analytics
- Gérer les domaines personnalisés
- Configurer les webhooks

## 🔧 Fichier de configuration Vercel (optionnel)

Si vous voulez personnaliser la configuration, créez un fichier `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

## ✅ Vérification après déploiement

1. Visitez votre URL Vercel
2. Testez la connexion
3. Vérifiez que la session persiste après rafraîchissement
4. Testez les fonctionnalités principales

## 🆘 En cas de problème

### Erreur de build

- Vérifiez les logs dans Vercel Dashboard
- Vérifiez que toutes les variables d'environnement sont configurées
- Vérifiez que `package.json` contient le script `build`

### Erreur d'authentification

- Vérifiez que les URLs sont bien configurées dans Supabase
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez que `NEXT_PUBLIC_APP_URL` pointe vers votre URL Vercel

### Erreur de base de données

- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que les politiques RLS permettent l'accès depuis Vercel

## 🎁 Bonus : Domaines personnalisés

Dans Vercel Dashboard → Settings → Domains, vous pouvez :
- Ajouter un domaine personnalisé (ex: `app.votre-domaine.com`)
- Configurer le SSL automatiquement
- Gérer les sous-domaines

