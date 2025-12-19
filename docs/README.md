# Application SaaS de Gestion d'Entreprise

Application complète de gestion d'entreprise avec gestion manuelle, automatique et vocale, et intégrations avec logiciels métier spécifiques.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ installé
- Compte Supabase créé
- Compte Stripe (pour les paiements)
- Compte Resend (pour les emails)
- Compte OpenAI (pour la gestion vocale, optionnel au début)

### Installation

1. **Installer les dépendances** :
```bash
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Puis éditez `.env` avec vos clés API :
- Supabase URL et clés
- Stripe clés
- Resend API key
- OpenAI API key (optionnel)

3. **Configurer Supabase** :
   - Créez un projet sur [supabase.com](https://supabase.com)
   - Récupérez l'URL et les clés API
   - Configurez la base de données (voir section Base de données)

4. **Générer le client Prisma** :
```bash
npm run db:generate
```

5. **Lancer l'application en développement** :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
├── src/
│   ├── core/              # Module core (auth, multi-tenant)
│   │   ├── registry.ts    # ⚠️ FICHIER TAMPON - Source de vérité
│   │   └── ...
│   ├── modules/           # Modules métier
│   │   ├── billing/       # Facturation
│   │   ├── accounting/    # Comptabilité
│   │   ├── hr/            # RH
│   │   └── ...
│   ├── components/        # Composants UI réutilisables
│   ├── lib/               # Utilitaires et helpers
│   └── types/             # Types TypeScript
├── prisma/                # Schéma Prisma et migrations
├── public/                # Fichiers statiques
└── app/                   # Routes Next.js App Router
```

## ⚠️ IMPORTANT : Fichier Registry

Le fichier `src/core/registry.ts` est **LA SOURCE DE VÉRITÉ** pour :
- ✅ Modules disponibles
- ✅ Tables de base de données
- ✅ Routes API
- ✅ Permissions
- ✅ Intégrations

**RÈGLE D'OR** : Avant de créer un nouveau module, table, route ou permission, **TOUJOURS** l'enregistrer dans `registry.ts` pour éviter les conflits.

## 🗄️ Base de données

### Configuration Supabase

1. Créez un projet Supabase
2. Dans l'éditeur SQL, exécutez les migrations dans `prisma/migrations/`
3. Configurez Row Level Security (RLS) pour l'isolation multi-tenant

### Migrations Prisma

```bash
# Créer une nouvelle migration
npm run db:migrate

# Appliquer les migrations
npm run db:push

# Ouvrir Prisma Studio
npm run db:studio
```

## 🔧 Développement

### Ajouter un nouveau module

1. **Enregistrer dans registry.ts** :
```typescript
// Dans APP_REGISTRY.modules
myModule: {
  id: 'myModule',
  name: 'Mon Module',
  tables: ['my_table'],
  routes: ['/api/my-module'],
  dependencies: ['core'],
}
```

2. **Créer la structure** :
```
src/modules/myModule/
├── components/
├── lib/
├── api/
└── types.ts
```

3. **Créer les tables Prisma** :
```prisma
model MyTable {
  id        String   @id @default(cuid())
  companyId String
  // ...
}
```

### Ajouter une nouvelle table

1. **Enregistrer dans registry.ts** :
```typescript
// Dans APP_REGISTRY.database
myTable: {
  module: 'myModule',
  columns: ['id', 'company_id', 'name'],
  indexes: ['id', 'company_id'],
  rls_enabled: true,
}
```

2. **Créer le modèle Prisma**
3. **Créer la migration**

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Isolation stricte par `company_id`
- Validation des permissions via le registry
- Tokens JWT via Supabase Auth

## 📚 Documentation

- [PRD complet](./PRD.md)
- [Guide de démarrage](./GUIDE_DEMARRAGE.md)
- [Instructions immédiates](./INSTRUCTIONS.md)
- [README complet](./README_COMPLET.md)

## 🛠️ Technologies

- **Frontend** : Next.js 14, React 18, TypeScript
- **Backend** : Next.js API Routes
- **Base de données** : Supabase (PostgreSQL)
- **ORM** : Prisma
- **UI** : Tailwind CSS, Shadcn/ui
- **Paiements** : Stripe
- **Email** : Resend
- **Automatisation** : Make, Inngest
- **Vocale** : OpenAI Whisper + GPT-4

## 📝 Scripts disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build de production
- `npm run start` - Démarre le serveur de production
- `npm run lint` - Vérifie le code
- `npm run type-check` - Vérifie les types TypeScript
- `npm run db:generate` - Génère le client Prisma
- `npm run db:migrate` - Crée/applique les migrations
- `npm run db:studio` - Ouvre Prisma Studio

## 🚨 Support

Pour toute question ou problème, consultez la documentation ou ouvrez une issue.

