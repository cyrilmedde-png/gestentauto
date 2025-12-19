# 🚀 Guide de Démarrage - Ce que vous devez faire

## Étape 1 : Installer Node.js

Si vous n'avez pas Node.js installé :

1. Allez sur [nodejs.org](https://nodejs.org/)
2. Téléchargez la version LTS (18 ou supérieur)
3. Installez-le
4. Vérifiez l'installation :
```bash
node --version
npm --version
```

## Étape 2 : Installer les dépendances du projet

Dans le dossier du projet, exécutez :

```bash
npm install
```

Cela installera tous les packages nécessaires (Next.js, React, Supabase, etc.)

## Étape 3 : Créer vos comptes (si pas déjà fait)

### 3.1 Supabase (Base de données)

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte (gratuit)
3. Créez un nouveau projet
4. Notez :
   - L'URL du projet (ex: `https://xxxxx.supabase.co`)
   - La clé "anon public" (dans Settings > API)
   - La clé "service_role" (dans Settings > API, gardez-la secrète !)

### 3.2 Stripe (Paiements)

1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte
3. Allez dans Developers > API keys
4. Notez :
   - La clé secrète (commence par `sk_test_...`)
   - La clé publique (commence par `pk_test_...`)

### 3.3 Resend (Emails)

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte
3. Créez une API key
4. Notez la clé API (commence par `re_...`)

### 3.4 OpenAI (Gestion vocale - optionnel pour commencer)

1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez un compte
3. Ajoutez des crédits
4. Créez une API key
5. Notez la clé (commence par `sk-...`)

## Étape 4 : Configurer les variables d'environnement

1. Copiez le fichier `.env.example` vers `.env` :
```bash
cp .env.example .env
```

2. Ouvrez le fichier `.env` et remplissez avec vos clés :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Stripe
STRIPE_SECRET_KEY=sk_test_votre_cle
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle

# Resend
RESEND_API_KEY=re_votre_cle

# OpenAI (optionnel pour commencer)
OPENAI_API_KEY=sk-votre_cle

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Étape 5 : Configurer la base de données Supabase

1. Dans votre projet Supabase, allez dans l'éditeur SQL
2. Nous créerons les tables plus tard, pour l'instant c'est OK

## Étape 6 : Lancer l'application

```bash
npm run dev
```

L'application devrait démarrer sur [http://localhost:3000](http://localhost:3000)

## ⚠️ IMPORTANT : Fichier Registry

Le fichier `src/core/registry.ts` est **CRUCIAL**. Il contient :
- ✅ Tous les modules
- ✅ Toutes les tables
- ✅ Toutes les routes
- ✅ Toutes les permissions

**NE MODIFIEZ JAMAIS ce fichier directement sans comprendre ce que vous faites !**

Ce fichier évite les conflits entre modules et garantit la cohérence de l'application.

## Prochaines étapes

Une fois l'application lancée, nous allons :
1. Créer le schéma de base de données
2. Configurer l'authentification
3. Créer les premiers modules
4. Mettre en place l'interface vocale
5. Ajouter les intégrations

## Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les variables d'environnement sont correctes
2. Vérifiez que Node.js est bien installé
3. Vérifiez les logs dans le terminal
4. Consultez la documentation dans `README.md`

