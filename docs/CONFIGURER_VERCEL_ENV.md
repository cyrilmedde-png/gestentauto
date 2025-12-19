# ⚙️ Configurer les Variables d'Environnement sur Vercel

## 📋 Variables Requises

Pour que l'application fonctionne sur Vercel, vous devez configurer ces variables d'environnement :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role (optionnel)
```

## 🔧 Étapes pour Configurer sur Vercel

### 1. Aller dans le Dashboard Vercel

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `gestentauto`

### 2. Accéder aux Variables d'Environnement

1. Allez dans **Settings** (Paramètres)
2. Cliquez sur **Environment Variables** (Variables d'environnement) dans le menu de gauche

### 3. Ajouter les Variables

Pour chaque variable :

1. Cliquez sur **Add New** (Ajouter)
2. Entrez le **Name** (Nom) : `NEXT_PUBLIC_SUPABASE_URL`
3. Entrez la **Value** (Valeur) : votre URL Supabase
4. Sélectionnez les **Environments** (Environnements) :
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optionnel)
5. Cliquez sur **Save** (Enregistrer)

### 4. Répéter pour Toutes les Variables

Répétez l'étape 3 pour :
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optionnel, mais recommandé)

### 5. Redéployer

Après avoir ajouté toutes les variables :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Vérifiez que **Use existing Build Cache** est décoché
5. Cliquez sur **Redeploy**

## 🔍 Où Trouver vos Variables Supabase

### Dans Supabase Dashboard :

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Vous trouverez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Vérification

Après le redéploiement, votre application devrait fonctionner sans l'erreur "Missing Supabase environment variables".

## 🚨 Note Importante

- Les variables qui commencent par `NEXT_PUBLIC_` sont exposées au client (navigateur)
- `SUPABASE_SERVICE_ROLE_KEY` est **SECRÈTE** et ne doit JAMAIS être exposée au client
- Vercel gère automatiquement la sécurité pour les variables sans `NEXT_PUBLIC_`

