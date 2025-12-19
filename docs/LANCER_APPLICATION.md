# 🚀 Lancer l'application - Étapes finales

## ✅ Vérifications

- ✅ Fichier `.env` existe
- ✅ `node_modules` installé
- ✅ Configuration Supabase complète

## 📋 Étapes pour lancer l'application

### Étape 1 : Mettre à jour le fichier .env

Assurez-vous que votre fichier `.env` contient bien les valeurs du template. Si vous avez modifié `env.template`, copiez les valeurs dans `.env`.

### Étape 2 : Générer le client Prisma

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm run db:generate
```

### Étape 3 : Créer les tables dans Supabase

```bash
npm run db:push
```

Cela va créer toutes les tables définies dans `prisma/schema.prisma` dans votre base de données Supabase.

### Étape 4 : Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3000**

## 🎯 Commandes en une seule fois

Vous pouvez exécuter toutes les étapes d'un coup :

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
npm run db:generate && npm run db:push && npm run dev
```

## ✅ Vérification

Si tout fonctionne, vous devriez voir :
- ✅ Le terminal affiche "Ready" et l'URL localhost:3000
- ✅ Aucune erreur dans le terminal
- ✅ La page d'accueil s'affiche dans le navigateur

## 🆘 En cas d'erreur

### Erreur Prisma
- Vérifiez que `DATABASE_URL` est correct dans `.env`
- Vérifiez que la base de données Supabase est accessible

### Erreur Supabase
- Vérifiez que les clés API sont correctes
- Vérifiez que l'URL Supabase est correcte (format: `https://xxx.supabase.co`)

### Erreur de port
Si le port 3000 est déjà utilisé :
```bash
PORT=3001 npm run dev
```

