# 📝 Comment créer et remplir le fichier .env

## ✅ Le fichier .env a été créé automatiquement !

Le fichier `.env` a été créé dans le dossier `gestion complete automatiser/`.

## 📋 Ce que vous devez faire maintenant

### Option 1 : Éditer avec un éditeur de texte

1. Ouvrez le fichier `.env` dans votre éditeur de texte préféré
2. Remplissez les valeurs vides avec vos clés API

### Option 2 : Éditer depuis le terminal

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
nano .env
# ou
code .env
# ou
open -a TextEdit .env
```

## 🔑 Variables à remplir

### 1. Supabase (OBLIGATOIRE pour commencer)

Après avoir créé votre projet Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[MOT-DE-PASSE]@db.xxxxx.supabase.co:5432/postgres
```

**Où trouver ces valeurs** :
- Allez sur [supabase.com](https://supabase.com)
- Créez un projet
- Settings > API → Copiez l'URL et les clés
- Settings > Database → Copiez la Connection string

### 2. Stripe (OPTIONNEL pour commencer)

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Resend (OPTIONNEL pour commencer)

```env
RESEND_API_KEY=re_...
```

### 4. OpenAI (OPTIONNEL pour commencer)

```env
OPENAI_API_KEY=sk-...
```

## ⚠️ IMPORTANT

- **Ne commitez JAMAIS le fichier .env** (il est déjà dans .gitignore)
- **Gardez vos clés secrètes** - Ne les partagez jamais
- **Pour commencer**, vous pouvez laisser Stripe, Resend et OpenAI vides
- **Supabase est OBLIGATOIRE** pour que l'application fonctionne

## ✅ Vérification

Pour vérifier que le fichier est bien créé :

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
ls -la .env
```

Vous devriez voir le fichier `.env` listé.

## 🚀 Prochaine étape

Une fois le fichier `.env` rempli avec au minimum les clés Supabase, vous pouvez :

```bash
npm run db:generate
npm run db:push
npm run dev
```

