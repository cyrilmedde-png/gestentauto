# 🔧 Correction des erreurs de build

## Problème

Le build échoue avec des erreurs "Module not found" pour :
- `@/lib/supabase/client`
- `@/components/layout/MainLayout`
- `@/components/auth/ProtectedRoute`

## Solution

### Option 1 : Nettoyer et reconstruire (recommandé)

Sur le serveur, dans `/var/www/talosprime`, exécutez :

```bash
# 1. Nettoyer
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# 2. Réinstaller
npm install

# 3. Rebuild
npm run build
```

### Option 2 : Vérifier que les fichiers sont bien présents

```bash
cd /var/www/talosprime

# Vérifier les fichiers
ls -la lib/supabase/client.ts
ls -la components/layout/MainLayout.tsx
ls -la components/auth/ProtectedRoute.tsx
```

Si un fichier manque, vérifiez que vous avez bien cloné tout le repo :

```bash
git status
git pull origin main
```

### Option 3 : Si le repo n'est pas complet

Si vous avez copié les fichiers manuellement et qu'il manque des dossiers :

```bash
cd /var/www/talosprime

# Vérifier la structure
ls -la lib/
ls -la components/

# Si les dossiers manquent, recloner depuis GitHub
cd /var/www
rm -rf talosprime
git clone https://github.com/cyrilmedde-png/gestentauto.git talosprime
cd talosprime
npm install
npm run build
```

---

## Après correction

Une fois le build réussi :

```bash
# Démarrer avec PM2
pm2 start npm --name "talosprime" -- start
pm2 save
```









