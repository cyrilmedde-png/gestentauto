# 🔍 Problèmes potentiels en développement local

## ❓ Est-ce que le développement en local peut poser ce genre de problème ?

**Oui**, le développement en local peut effectivement causer des problèmes de persistance de session. Voici les raisons principales :

## 🔴 Problèmes courants en local

### 1. **HTTPS vs HTTP**
- **Supabase** utilise HTTPS (sécurisé)
- **Localhost** utilise HTTP (non sécurisé)
- Les cookies avec l'option `secure` ne fonctionnent pas en HTTP
- **Solution** : Supabase stocke dans localStorage, donc ça devrait fonctionner, mais les requêtes peuvent échouer

### 2. **Configuration Supabase - URLs autorisées**
Dans le dashboard Supabase, vous devez vérifier :
- **Authentication → URL Configuration**
- Ajouter `http://localhost:4000` dans les URLs autorisées
- Ajouter `http://localhost:4000/**` pour tous les chemins

### 3. **Row Level Security (RLS)**
- Les politiques RLS peuvent bloquer les requêtes en local
- Si les politiques ne sont pas configurées pour `localhost`, les requêtes échouent
- **Solution** : Désactiver temporairement RLS pour les tables `users` et `companies` en développement, ou créer des politiques qui autorisent l'accès local

### 4. **CORS (Cross-Origin Resource Sharing)**
- Si les headers CORS ne sont pas configurés correctement
- Les requêtes depuis `localhost:4000` vers Supabase peuvent être bloquées
- **Solution** : Vérifier la configuration CORS dans Supabase

### 5. **Cookies de session**
- Les cookies peuvent ne pas fonctionner correctement entre `localhost` et le domaine Supabase
- **Solution** : C'est pourquoi Supabase utilise localStorage par défaut, ce qui devrait fonctionner

### 6. **Cache du navigateur**
- Le navigateur peut cacher d'anciennes sessions
- Les extensions de navigateur peuvent interférer
- **Solution** : Tester en navigation privée

## ✅ Vérifications à faire

### 1. Vérifier les URLs dans Supabase Dashboard

Allez dans **Authentication → URL Configuration** et vérifiez que vous avez :
```
http://localhost:4000
http://localhost:4000/**
http://localhost:4000/auth/callback
```

### 2. Vérifier les politiques RLS

Dans **Table Editor → users**, cliquez sur **RLS** et vérifiez les politiques :
- Si RLS est activé mais aucune politique n'autorise l'accès, les requêtes échouent
- Créez une politique temporaire pour le développement :
```sql
-- Permettre l'accès à son propre utilisateur
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

### 3. Vérifier la console du navigateur

Ouvrez les DevTools (F12) et allez dans l'onglet **Network** :
- Regardez les requêtes vers Supabase
- Vérifiez les headers de réponse
- Vérifiez s'il y a des erreurs CORS ou 401/403

### 4. Tester en navigation privée

Testez dans une fenêtre de navigation privée pour éliminer les problèmes de cache :
- Ouvrez une fenêtre privée
- Allez sur `http://localhost:4000`
- Connectez-vous
- Rafraîchissez la page

### 5. Vérifier les variables d'environnement

Assurez-vous que `.env` contient :
```env
NEXT_PUBLIC_SUPABASE_URL=https://lkzfmialjaryobminfbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

## 🔧 Solutions temporaires pour le développement

### Option 1: Utiliser un tunnel HTTPS (ngrok)
```bash
ngrok http 4000
```
Cela crée une URL HTTPS qui pointe vers votre localhost.

### Option 2: Désactiver temporairement RLS
Dans Supabase SQL Editor :
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```
⚠️ **ATTENTION** : Ne faites ça QUE en développement local, jamais en production !

### Option 3: Créer des politiques permissives pour le développement
```sql
-- Permettre tout en développement (ATTENTION: pour développement seulement!)
CREATE POLICY "dev_all_access" ON users FOR ALL
USING (true)
WITH CHECK (true);
```

## 🎯 Recommandation

Pour votre cas spécifique (problème de session qui se perd), la cause la plus probable est :

1. **Les politiques RLS** qui bloquent les requêtes vers la table `users`
2. **La configuration des URLs autorisées** dans Supabase

**Action immédiate** :
1. Vérifiez dans Supabase Dashboard → Authentication → URL Configuration
2. Ajoutez `http://localhost:4000` si ce n'est pas déjà fait
3. Vérifiez les politiques RLS sur la table `users`

La modification que j'ai faite dans le code (définir la session immédiatement depuis localStorage) devrait aider, mais si le problème persiste, c'est probablement une configuration Supabase.

