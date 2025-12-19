# 🏢 Application SaaS de Gestion d'Entreprise

Application complète de gestion d'entreprise avec tous les modules nécessaires pour une gestion totale et indépendante.

## ✨ Fonctionnalités

- 🔐 Authentification sécurisée (Supabase Auth)
- 🏢 Gestion multi-tenant
- 📊 Tableau de bord personnalisable
- 💰 Facturation
- 👥 CRM
- 📄 Gestion documentaire
- 📈 Reporting avancé
- 🔄 Workflows automatisés
- 🎤 Gestion vocale (à venir)
- 🔗 Intégrations avec logiciels métiers

## 🛠️ Technologies

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **UI** : React 18, Tailwind CSS, Shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **ORM** : Prisma
- **Authentification** : Supabase Auth
- **État** : React Context, Zustand
- **Formulaires** : React Hook Form, Zod

## 📦 Installation

### Prérequis

- Node.js >= 18.17.0
- npm >= 9.0.0
- Compte Supabase

### Installation des dépendances

```bash
npm install
```

### Configuration

1. Copiez `env.template` vers `.env` :
```bash
cp env.template .env
```

2. Remplissez les variables d'environnement dans `.env` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

3. Générez le client Prisma :
```bash
npm run db:generate
```

4. Créez les tables dans Supabase :
```bash
npm run db:push
```

### Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:4000**

## 📚 Documentation

La documentation complète est disponible dans le dossier [`docs/`](./docs/) :

- [Guide de démarrage](./docs/GUIDE_DEMARRAGE.md)
- [Instructions immédiates](./docs/INSTRUCTIONS.md)
- [Guide d'hébergement](./docs/HEBERGEMENT_DEVELOPPEMENT.md)
- [Publier sur GitHub](./docs/PUBLIER_SUR_GITHUB.md)
- [PRD complet](./docs/PRD.md)

## 🏗️ Architecture

```
gestion-complete-automatiser/
├── app/                    # Pages Next.js (App Router)
├── src/
│   ├── components/         # Composants React réutilisables
│   ├── modules/            # Modules métier
│   │   └── core/          # Module Core (auth, settings)
│   └── lib/               # Utilitaires et configurations
├── prisma/                # Schéma Prisma
├── docs/                  # Documentation
└── public/                # Fichiers statiques
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez automatiquement à chaque push

Voir le [guide d'hébergement](./docs/HEBERGEMENT_DEVELOPPEMENT.md) pour plus de détails.

## 📝 Scripts disponibles

- `npm run dev` : Lancer le serveur de développement
- `npm run build` : Construire l'application pour la production
- `npm run start` : Lancer le serveur de production
- `npm run lint` : Vérifier le code avec ESLint
- `npm run clean` : Nettoyer le cache Next.js
- `npm run dev:clean` : Nettoyer et lancer le serveur

## 🔒 Sécurité

- Les clés API et secrets sont stockés dans `.env` (jamais commité)
- Authentification via Supabase Auth (JWT)
- Row Level Security (RLS) sur Supabase
- Validation des données avec Zod

## 📄 Licence

[À définir]

## 👥 Contribution

[À définir]

## 📞 Support

Pour toute question, consultez la [documentation](./docs/) ou ouvrez une issue sur GitHub.

