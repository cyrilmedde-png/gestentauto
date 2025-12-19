# 🚀 Commandes pour lancer l'application

## ⚠️ Important

Vous devez exécuter ces commandes **dans votre terminal** (pas via l'IDE).

## 📋 Étapes à suivre

### 1. Ouvrir un terminal

Ouvrez Terminal (macOS) ou votre terminal préféré.

### 2. Aller dans le dossier du projet

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
```

### 3. Vérifier que le fichier .env est à jour

Assurez-vous que votre fichier `.env` contient bien toutes les valeurs de `env.template` :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### 4. Générer le client Prisma

```bash
npm run db:generate
```

Vous devriez voir : `✔ Generated Prisma Client`

### 5. Créer les tables dans Supabase

```bash
npm run db:push
```

Cette commande va :
- Se connecter à votre base de données Supabase
- Créer toutes les tables définies dans le schéma
- Vous demander confirmation (tapez `y` puis Entrée)

### 6. Lancer l'application

```bash
npm run dev
```

Vous devriez voir :
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### 7. Ouvrir dans le navigateur

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

## 🎯 Toutes les commandes en une fois

Si vous préférez tout faire d'un coup :

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm run db:generate && npm run db:push && npm run dev
```

## ✅ Vérification

Si tout fonctionne :
- ✅ Le terminal affiche "Ready" avec l'URL localhost:3000
- ✅ Aucune erreur rouge dans le terminal
- ✅ La page d'accueil s'affiche dans le navigateur

## 🆘 En cas d'erreur

### Erreur "DATABASE_URL not found"
- Vérifiez que le fichier `.env` existe
- Vérifiez que `DATABASE_URL` est bien rempli dans `.env`
- Vérifiez qu'il n'y a pas d'espaces autour du `=`

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que le mot de passe dans l'URL est correct
- Vérifiez que votre projet Supabase est actif

### Erreur "Port 3000 already in use"
```bash
PORT=3001 npm run dev
```

## 📝 Note

Le fichier `.env` est protégé pour des raisons de sécurité, c'est pourquoi certaines commandes doivent être exécutées manuellement dans votre terminal.

