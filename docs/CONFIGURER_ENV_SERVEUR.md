# 🔧 Configuration des variables d'environnement sur le serveur

## ⚠️ IMPORTANT

Dans Next.js, les variables d'environnement qui commencent par `NEXT_PUBLIC_*` doivent être présentes **au moment du BUILD**, pas seulement au runtime.

Si vous avez déjà fait un build sans ces variables, vous devez **REBUILD** l'application après avoir créé le fichier `.env.production`.

---

## 📝 Étape 1 : Créer le fichier .env.production

Sur le serveur, connectez-vous et créez le fichier :

```bash
ssh cursor@82.165.129.143
cd /var/www/talosprime
nano .env.production
```

**Collez ce contenu** (remplacez les valeurs par vos vraies clés) :

```env
# ========================================
# SUPABASE (OBLIGATOIRE)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici

# ========================================
# RESEND (Email) - OBLIGATOIRE
# ========================================
RESEND_API_KEY=re_votre_cle_api_resend
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime

# ========================================
# TWILIO (SMS) - OPTIONNEL
# ========================================
TWILIO_ACCOUNT_SID=ACvotre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678

# ========================================
# STRIPE (Paiement) - OPTIONNEL (pour l'instant)
# ========================================
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# ========================================
# APPLICATION
# ========================================
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://talosprime.fr
```

💡 **Astuce** : Un template complet est disponible dans le fichier `.env.production.template` à la racine du projet.

**Pour sauvegarder :** 
- Appuyez sur `Ctrl+X`
- Puis `Y` (pour confirmer)
- Puis `Entrée` (pour sauvegarder)

---

## 🔍 Étape 2 : Vérifier que le fichier existe

```bash
cat .env.production
```

Vous devriez voir toutes vos variables d'environnement.

---

## 🔨 Étape 3 : REBUILD l'application

**⚠️ CRUCIAL :** Vous devez reconstruire l'application pour que les variables `NEXT_PUBLIC_*` soient intégrées dans le bundle.

```bash
cd /var/www/talosprime

# Arrêter l'application PM2
pm2 stop talosprime

# Nettoyer le cache de build
rm -rf .next

# Reconstruire avec les nouvelles variables d'environnement
npm run build

# Redémarrer l'application
pm2 start npm --name "talosprime" -- start
```

---

## ✅ Étape 4 : Vérifier que ça fonctionne

```bash
# Vérifier le statut PM2
pm2 status

# Voir les logs
pm2 logs talosprime --lines 50
```

L'application devrait maintenant être accessible sans l'erreur "NEXT_PUBLIC_SUPABASE_URL is not set".

---

## 🔐 Où trouver vos clés Supabase ?

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Vous trouverez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez-la secrète !)

---

## 🐛 Dépannage

### L'erreur persiste après le rebuild ?

1. **Vérifiez que le fichier `.env.production` est au bon endroit :**
   ```bash
   pwd
   # Doit afficher : /var/www/talosprime
   ls -la .env.production
   # Doit afficher le fichier
   ```

2. **Vérifiez le contenu du fichier :**
   ```bash
   cat .env.production | grep NEXT_PUBLIC_SUPABASE_URL
   # Doit afficher votre URL Supabase
   ```

3. **Vérifiez que le build a bien lu les variables :**
   ```bash
   # Dans le dossier .next, vérifiez qu'il y a bien un build
   ls -la .next
   ```

4. **Forcez un rebuild complet :**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   pm2 restart talosprime
   ```

---

## 📚 Ressources

- [Documentation Next.js - Variables d'environnement](https://nextjs.org/docs/basic-features/environment-variables)
- [Documentation Supabase - Configuration](https://supabase.com/docs/guides/getting-started/local-development#env-setup)

