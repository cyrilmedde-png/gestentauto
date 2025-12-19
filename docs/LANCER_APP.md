# 🚀 Lancer l'application

## ⚠️ Erreur courante : "Could not read package.json"

Si vous voyez cette erreur :
```
npm error code ENOENT
Could not read package.json: Error: ENOENT: no such file or directory
```

**C'est parce que vous n'êtes pas dans le bon répertoire !**

## ✅ Solution

Vous devez **d'abord naviguer vers le répertoire du projet** avant de lancer `npm run dev`.

### Étape 1 : Aller dans le dossier du projet

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"
```

### Étape 2 : Vérifier que vous êtes au bon endroit

```bash
pwd
```

Vous devriez voir :
```
/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser
```

### Étape 3 : Vérifier que package.json existe

```bash
ls package.json
```

Si vous voyez `package.json`, c'est bon !

### Étape 4 : Lancer l'application

```bash
npm run dev
```

## 📝 Résumé des commandes

```bash
# 1. Aller dans le projet
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"

# 2. Lancer le serveur
npm run dev
```

L'application sera accessible sur **http://localhost:4000**

## 🎯 Astuce

Pour éviter d'oublier, vous pouvez créer un alias dans votre `~/.zshrc` :

```bash
echo 'alias dev-app="cd /Users/giiz_mo_o/Desktop/devellopement\ application/gestion\ complete\ automatiser && npm run dev"' >> ~/.zshrc
source ~/.zshrc
```

Ensuite, vous pourrez simplement taper `dev-app` depuis n'importe où !

