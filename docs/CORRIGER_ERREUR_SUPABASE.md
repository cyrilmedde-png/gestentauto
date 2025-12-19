# 🔧 Corriger l'erreur "supabaseKey is required"

## ❌ Erreur rencontrée

```
Error: supabaseKey is required.
```

Cette erreur signifie que les variables d'environnement Supabase ne sont pas correctement chargées.

## ✅ Solution

### 1. Vérifier le fichier .env

Assurez-vous que votre fichier `.env` contient bien toutes les variables Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://lkzfmialjaryobminfbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Redémarrer le serveur de développement

Après avoir modifié le fichier `.env`, vous **DEVEZ** redémarrer le serveur :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Relancez-le :
```bash
npm run dev
```

**⚠️ IMPORTANT** : Next.js ne recharge pas automatiquement les variables d'environnement. Il faut toujours redémarrer le serveur après modification du `.env`.

### 3. Vérifier que les variables sont chargées

Les variables qui commencent par `NEXT_PUBLIC_` sont accessibles côté client.
Les autres variables (comme `SUPABASE_SERVICE_ROLE_KEY`) sont uniquement côté serveur.

## 🔍 Vérification

Pour vérifier que les variables sont bien chargées, vous pouvez temporairement ajouter dans votre code :

```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Présent' : '❌ Manquant')
```

## 📝 Correction appliquée

J'ai modifié le fichier `src/lib/supabase.ts` pour :
- ✅ Gérer le cas où `SUPABASE_SERVICE_ROLE_KEY` est absent
- ✅ Afficher un message d'erreur plus clair
- ✅ Éviter les erreurs si la clé service role n'est pas définie

## 🚀 Après correction

1. Vérifiez votre fichier `.env`
2. Redémarrez le serveur : `npm run dev`
3. Actualisez la page dans le navigateur

L'erreur devrait disparaître.

