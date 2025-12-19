# Application SaaS de Gestion d'Entreprise

Application complète de gestion d'entreprise avec gestion manuelle, automatique et vocale, et intégrations avec logiciels métier spécifiques.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
cp .env.example .env
# Éditez .env avec vos clés API
npm run db:generate
npm run db:push
npm run dev
```

## 📚 Documentation

Toute la documentation est disponible dans le dossier [`docs/`](./docs/) :

- **[Guide de démarrage](./docs/GUIDE_DEMARRAGE.md)** - Instructions pas à pas pour commencer
- **[Instructions immédiates](./docs/INSTRUCTIONS.md)** - Ce que vous devez faire maintenant
- **[PRD complet](./docs/PRD.md)** - Spécifications complètes du produit
- **[README détaillé](./docs/README.md)** - Documentation complète du projet

## ⚠️ IMPORTANT : Fichier Registry

Le fichier `src/core/registry.ts` est **LA SOURCE DE VÉRITÉ** pour éviter les conflits entre modules, tables et routes.

## 🛠️ Technologies

- Next.js 14, React 18, TypeScript
- Supabase (PostgreSQL, Auth, Storage)
- Prisma ORM
- Stripe, Resend, OpenAI
- Tailwind CSS, Shadcn/ui

## 📝 Scripts

- `npm run dev` - Démarrage développement
- `npm run build` - Build production
- `npm run db:generate` - Générer client Prisma
- `npm run db:push` - Pousser schéma vers DB
- `npm run db:studio` - Ouvrir Prisma Studio
