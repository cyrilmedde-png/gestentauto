# 📦 Installation @supabase/ssr

## Package ajouté

Le package `@supabase/ssr` a été ajouté au `package.json` pour gérer correctement les cookies de session Supabase dans Next.js.

## Installation

### Sur votre machine locale

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm install
```

### Sur le serveur

```bash
cd /var/www/talosprime
npm install
```

## Changements appliqués

1. **lib/supabase/server.ts** : Utilise maintenant `@supabase/ssr` pour gérer les cookies correctement
2. **app/api/platform/leads/route.ts** : Code simplifié pour utiliser uniquement `platform_leads`
3. **package.json** : Ajout de `@supabase/ssr` dans les dependencies

## Avantages

- ✅ Gestion correcte des cookies de session Supabase dans les API routes
- ✅ Plus besoin de passer l'ID utilisateur dans les headers
- ✅ Code plus simple et maintenable
- ✅ Utilise la méthode recommandée par Supabase pour Next.js









