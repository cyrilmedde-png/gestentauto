# 📚 Documentation - Application SaaS de Gestion d'Entreprise

Bienvenue dans la documentation de l'application. Tous les fichiers de documentation sont organisés ici.

## 📖 Fichiers disponibles

- **[README complet](./README_COMPLET.md)** - Documentation complète du projet
- **[Guide de démarrage](./GUIDE_DEMARRAGE.md)** - Instructions pas à pas pour commencer
- **[Instructions immédiates](./INSTRUCTIONS.md)** - Ce que vous devez faire maintenant
- **[PRD complet](./PRD.md)** - Spécifications complètes du produit (Product Requirements Document)

## 🚀 Démarrage rapide

1. Installez les dépendances : `npm install`
2. Configurez `.env` : `cp .env.example .env`
3. Configurez Supabase (voir [Guide de démarrage](./GUIDE_DEMARRAGE.md))
4. Lancez l'application : `npm run dev`

## ⚠️ IMPORTANT

Le fichier `src/core/registry.ts` est **LA SOURCE DE VÉRITÉ** pour éviter les conflits entre modules, tables et routes.

## 📁 Structure du projet

```
├── docs/              # 📚 Toute la documentation ici
├── src/
│   ├── core/
│   │   └── registry.ts  # ⚠️ Fichier tampon central
│   └── modules/         # Modules métier
├── app/                 # Routes Next.js
├── prisma/              # Schéma base de données
└── ...
```

