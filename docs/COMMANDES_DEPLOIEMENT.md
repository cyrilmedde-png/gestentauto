# 🚀 Commandes de déploiement - Système de modules

## 📁 Fichiers créés (à pousser sur GitHub)

```
✅ supabase/migrations/install_modules_subscriptions.sql
✅ lib/modules/subscriptions.ts
✅ lib/hooks/useModules.ts
✅ app/api/platform/n8n/modules/register/route.ts
✅ app/api/platform/subscriptions/modules/route.ts
✅ app/platform/workflows/[slug]/page.tsx
✅ app/platform/subscriptions/page.tsx
✅ components/layout/Sidebar.tsx
```

---

## 🔧 COMMANDES À EXÉCUTER (dans l'ordre)

### 1️⃣ Sur votre machine locale - Pousser sur GitHub

```bash
cd "/Users/giiz_mo_o/Desktop/devellopement application/gestion complete automatiser" && \
git add supabase/migrations/install_modules_subscriptions.sql lib/modules/subscriptions.ts lib/hooks/useModules.ts app/api/platform/n8n/modules/register/route.ts app/api/platform/subscriptions/modules/route.ts "app/platform/workflows/[slug]/page.tsx" app/platform/subscriptions/page.tsx components/layout/Sidebar.tsx && \
git commit -m "feat: Système de modules avec abonnements Stripe" && \
git push origin main
```

### 2️⃣ Sur le serveur - Récupérer et redémarrer

```bash
ssh root@82.165.129.143 "cd /var/www/talosprime && git pull origin main && pm2 restart talosprime"
```

### 3️⃣ Dans Supabase - Exécuter le SQL

**Option A : Via l'interface Supabase**
1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de `supabase/migrations/install_modules_subscriptions.sql`
5. Cliquer sur **Run**

**Option B : Via la ligne de commande (si vous avez Supabase CLI)**
```bash
# Afficher le contenu du fichier SQL
cat supabase/migrations/install_modules_subscriptions.sql

# Puis copier-coller dans Supabase SQL Editor
```

---

## ✅ VÉRIFICATION (après déploiement)

### Vérifier les tables dans Supabase SQL Editor :

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

### Vérifier l'application :

1. Se connecter à https://www.talosprimes.com
2. Vérifier que la sidebar affiche les modules
3. Aller sur `/platform/subscriptions` pour voir les modules disponibles
4. Vérifier que le module "Leads" n'apparaît que si activé

---

## 📝 FICHIER SQL COMPLET

Le fichier SQL complet se trouve dans :
```
supabase/migrations/install_modules_subscriptions.sql
```

**Contenu :**
- Création des 3 tables (available_modules, subscriptions, company_modules)
- Index pour performance
- RLS (Row Level Security) et politiques
- Insertion des modules de base (Starter 19,99€, Leads 29,99€)
- Triggers pour updated_at

---

## 🐛 EN CAS D'ERREUR

### Erreur "table already exists"
✅ Normal, le script utilise `CREATE TABLE IF NOT EXISTS`

### Erreur "policy already exists"
✅ Le script utilise `DROP POLICY IF EXISTS` avant de créer

### Erreur RLS
✅ Vérifier que l'utilisateur a un `company_id` dans la table `users`




