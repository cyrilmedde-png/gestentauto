# 🚀 Actions Immédiates - À FAIRE MAINTENANT

## Étape 1 : Installer les dépendances (2 minutes)

Ouvrez un terminal et exécutez :

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm install
```

**Si erreur de permissions** :
```bash
sudo npm install
```

**Attendez que l'installation se termine** (peut prendre 2-5 minutes)

---

## Étape 2 : Créer le fichier .env (1 minute)

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
```

Créez le fichier `.env` (copiez le contenu ci-dessous et adaptez) :

```env
# Supabase (à remplir après création du projet)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Stripe (optionnel pour commencer)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (optionnel pour commencer)
RESEND_API_KEY=

# OpenAI (optionnel pour commencer)
OPENAI_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Étape 3 : Créer un projet Supabase (10 minutes)

1. Allez sur **https://supabase.com**
2. Créez un compte (gratuit)
3. Cliquez sur "New Project"
4. Remplissez :
   - Nom du projet
   - Mot de passe de la base de données (notez-le !)
   - Région (choisissez la plus proche)
5. Attendez la création (2-3 minutes)

### Récupérer les clés :

1. Dans votre projet Supabase, allez dans **Settings > API**
2. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez secrète !)

3. Allez dans **Settings > Database**
4. Copiez la **Connection string** (URI) → `DATABASE_URL`
   - Format : `postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.xxxxx.supabase.co:5432/postgres`

5. Mettez à jour votre fichier `.env` avec ces valeurs

---

## Étape 4 : Initialiser la base de données (2 minutes)

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"

# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers Supabase
npm run db:push
```

Cela créera toutes les tables dans votre base de données.

---

## Étape 5 : Lancer l'application (30 secondes)

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm run dev
```

Ouvrez votre navigateur sur : **http://localhost:3000**

---

## ✅ Vérification

Si tout fonctionne, vous devriez voir :
- ✅ L'application se lance sans erreur
- ✅ La page d'accueil s'affiche
- ✅ Aucune erreur dans le terminal

---

## 🆘 En cas de problème

1. **Erreur "Cannot find module"** :
   - Vérifiez que `npm install` a bien fonctionné
   - Supprimez `node_modules` et relancez `npm install`

2. **Erreur Supabase** :
   - Vérifiez que les clés dans `.env` sont correctes
   - Vérifiez que le projet Supabase est actif

3. **Erreur Prisma** :
   - Vérifiez que `DATABASE_URL` est correct dans `.env`
   - Vérifiez que la base de données Supabase est accessible

---

## 📚 Documentation complète

Consultez `docs/GUIDE_DEMARRAGE.md` pour plus de détails.

