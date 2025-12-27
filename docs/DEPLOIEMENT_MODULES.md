# Guide de déploiement : Système de modules avec abonnements

## 📋 Fichiers créés/modifiés

### 1. Base de données Supabase
- ✅ `supabase/migrations/install_modules_subscriptions.sql` - **À exécuter dans Supabase**

### 2. Utilitaires
- ✅ `lib/modules/subscriptions.ts` - Fonctions de gestion des modules
- ✅ `lib/hooks/useModules.ts` - Hook React pour les modules

### 3. APIs
- ✅ `app/api/platform/n8n/modules/register/route.ts` - Enregistrement de modules depuis N8N
- ✅ `app/api/platform/subscriptions/modules/route.ts` - Récupération des modules

### 4. Pages
- ✅ `app/platform/workflows/[slug]/page.tsx` - Page générique pour modules N8N
- ✅ `app/platform/subscriptions/page.tsx` - Page de gestion des abonnements

### 5. Composants
- ✅ `components/layout/Sidebar.tsx` - Sidebar modifiée (affichage dynamique)

---

## 🚀 Déploiement en 3 étapes

### ÉTAPE 1 : Exécuter le script SQL dans Supabase

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com
   - Sélectionner votre projet
   - Aller dans **SQL Editor**

2. **Copier-coller le contenu du fichier SQL**
   ```bash
   # Sur votre machine locale, afficher le contenu :
   cat supabase/migrations/install_modules_subscriptions.sql
   ```

3. **Exécuter dans Supabase SQL Editor**
   - Coller le contenu
   - Cliquer sur **Run** ou `Ctrl+Enter`
   - Vérifier qu'il n'y a pas d'erreurs

### ÉTAPE 2 : Pousser les fichiers sur le serveur

```bash
# Sur votre machine locale
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser"

# Ajouter tous les fichiers
git add supabase/migrations/install_modules_subscriptions.sql
git add lib/modules/subscriptions.ts
git add lib/hooks/useModules.ts
git add app/api/platform/n8n/modules/register/route.ts
git add app/api/platform/subscriptions/modules/route.ts
git add app/platform/workflows/\[slug\]/page.tsx
git add app/platform/subscriptions/page.tsx
git add components/layout/Sidebar.tsx

# Commit
git commit -m "feat: Système de modules avec abonnements Stripe

- Tables Supabase (available_modules, subscriptions, company_modules)
- API pour enregistrer modules depuis N8N
- Sidebar dynamique avec vérification d'abonnements
- Page de gestion des abonnements
- Page générique pour modules créés par N8N"

# Push
git push origin main
```

### ÉTAPE 3 : Déployer sur le serveur

```bash
# Se connecter au serveur
ssh root@82.165.129.143

# Aller dans le répertoire du projet
cd /var/www/talosprime

# Récupérer les changements
git pull origin main

# Redémarrer l'application (si nécessaire)
pm2 restart talosprime
```

---

## ✅ Vérification

### 1. Vérifier les tables dans Supabase
```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('available_modules', 'subscriptions', 'company_modules');

-- Vérifier les modules de base
SELECT name, display_name, price_monthly, category 
FROM available_modules;
```

### 2. Tester l'API
```bash
# Sur le serveur ou en local
curl -X GET https://www.talosprimes.com/api/platform/subscriptions/modules \
  -H "Cookie: votre-session-cookie"
```

### 3. Vérifier la sidebar
- Se connecter à l'application
- Vérifier que la sidebar affiche les modules
- Vérifier que le module "Leads" n'apparaît que si activé

---

## 🔧 Commandes rapides (tout en une fois)

### Sur votre machine locale :

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser" && \
git add supabase/migrations/install_modules_subscriptions.sql lib/modules/subscriptions.ts lib/hooks/useModules.ts app/api/platform/n8n/modules/register/route.ts app/api/platform/subscriptions/modules/route.ts "app/platform/workflows/[slug]/page.tsx" app/platform/subscriptions/page.tsx components/layout/Sidebar.tsx && \
git commit -m "feat: Système de modules avec abonnements Stripe" && \
git push origin main
```

### Sur le serveur :

```bash
ssh root@82.165.129.143 "cd /var/www/talosprime && git pull origin main && pm2 restart talosprime"
```

---

## 📝 Notes importantes

1. **Le module "starter" est toujours accessible** (pack de base)
2. **Le module "leads" nécessite un abonnement** (29,99€/mois)
3. **Les modules créés par N8N** peuvent être enregistrés via `/api/platform/n8n/modules/register`
4. **La sidebar affiche uniquement les modules actifs** pour l'entreprise de l'utilisateur

---

## 🐛 En cas d'erreur

### Erreur "table already exists"
- Les tables existent déjà, c'est normal
- Le script utilise `CREATE TABLE IF NOT EXISTS`, donc pas de problème

### Erreur "policy already exists"
- Les politiques existent déjà
- Le script utilise `DROP POLICY IF EXISTS` avant de créer, donc pas de problème

### Erreur RLS
- Vérifier que les politiques sont bien créées
- Vérifier que l'utilisateur a bien un `company_id` dans la table `users`



