# 📋 Instructions - Ce que vous devez faire MAINTENANT

## ✅ Ce qui a été fait

1. ✅ Structure du projet créée
2. ✅ Fichier **registry.ts** créé (fichier tampon central)
3. ✅ Configuration Next.js, TypeScript, Tailwind
4. ✅ Schéma Prisma avec toutes les tables
5. ✅ Fichiers de configuration de base

## 🚀 Actions à faire IMMÉDIATEMENT

### 1. Installer Node.js (si pas déjà fait)

Vérifiez si Node.js est installé :
```bash
node --version
```

Si pas installé, allez sur [nodejs.org](https://nodejs.org/) et installez la version LTS.

### 2. Installer les dépendances

Dans le terminal, dans le dossier du projet, exécutez :

```bash
npm install
```

**⚠️ Si vous avez une erreur de permissions**, essayez :
```bash
sudo npm install
```

Ou installez les dépendances globalement avec nvm (recommandé).

### 3. Créer le fichier .env

```bash
cp .env.example .env
```

Puis éditez `.env` avec vos clés API (voir GUIDE_DEMARRAGE.md).

### 4. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte et un nouveau projet
3. Récupérez l'URL et les clés API
4. Ajoutez-les dans votre fichier `.env`

### 5. Configurer la base de données

Une fois Supabase configuré, exécutez :

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers Supabase
npm run db:push
```

### 6. Lancer l'application

```bash
npm run dev
```

L'application sera sur [http://localhost:3000](http://localhost:3000)

## ⚠️ FICHIER REGISTRY - TRÈS IMPORTANT

Le fichier `src/core/registry.ts` est **LA SOURCE DE VÉRITÉ** pour éviter les conflits.

**RÈGLES D'OR** :
1. ✅ Toujours vérifier le registry avant de créer un module
2. ✅ Toujours enregistrer les nouvelles tables dans le registry
3. ✅ Toujours enregistrer les nouvelles routes dans le registry
4. ❌ Ne jamais créer de module/table/route sans l'enregistrer

## 📁 Structure créée

```
├── src/
│   ├── core/
│   │   └── registry.ts    ⚠️ FICHIER TAMPON
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── prisma.ts
│   └── modules/            (à créer au fur et à mesure)
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── prisma/
│   └── schema.prisma      (toutes les tables définies)
├── package.json
├── tsconfig.json
└── GUIDE_DEMARRAGE.md     (lisez-le !)
```

## 🎯 Prochaines étapes

Une fois l'application lancée, nous allons :
1. Créer le module Core (authentification)
2. Mettre en place l'isolation multi-tenant
3. Créer les premiers modules métier
4. Ajouter l'interface vocale
5. Configurer les intégrations

## ❓ Besoin d'aide ?

1. Lisez `GUIDE_DEMARRAGE.md` pour les détails
2. Lisez `README.md` pour la documentation complète
3. Consultez `PRD.md` pour les spécifications

## 🔐 Sécurité

- Ne commitez JAMAIS le fichier `.env`
- Gardez vos clés API secrètes
- Utilisez les variables d'environnement

