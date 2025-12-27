# Template pour .env.production

Ce fichier liste toutes les variables d'environnement nécessaires pour le fichier `.env.production` sur le serveur.

## Variables Supabase (OBLIGATOIRES)

```env
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co

# Clé anonyme (anon key) de Supabase (publique, peut être exposée côté client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici

# Clé service role (SECRÈTE, ne jamais exposer côté client)
# Utilisée pour les opérations admin qui bypassent RLS
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

## Variables N8N (OBLIGATOIRES pour le module N8N)

```env
# URL d'accès à N8N
N8N_URL=https://n8n.talosprimes.com

# Identifiants Basic Auth pour N8N
N8N_BASIC_AUTH_USER=votre_email@example.com
N8N_BASIC_AUTH_PASSWORD=votre_mot_de_passe
```

## Variables Application

```env
# URL publique de l'application
NEXT_PUBLIC_APP_URL=https://www.talosprimes.com

# Environnement
NODE_ENV=production
```

## Variables Email (Resend)

```env
# Clé API Resend pour l'envoi d'emails
RESEND_API_KEY=re_votre_cle_api

# Email expéditeur par défaut
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime
```

## Variables SMS (Twilio - Optionnel)

```env
# Identifiants Twilio pour l'envoi de SMS
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678
```

## Variables Stripe (Optionnel - pour les paiements)

```env
# Clés API Stripe
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
```

## Où trouver les valeurs Supabase ?

1. **NEXT_PUBLIC_SUPABASE_URL** :
   - Allez sur https://supabase.com
   - Sélectionnez votre projet
   - Allez dans Settings > API
   - Copiez "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** :
   - Même page (Settings > API)
   - Copiez "anon public" key

3. **SUPABASE_SERVICE_ROLE_KEY** :
   - Même page (Settings > API)
   - Copiez "service_role" key (⚠️ SECRÈTE, ne jamais partager)

## Exemple complet

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# N8N
N8N_URL=https://n8n.talosprimes.com
N8N_BASIC_AUTH_USER=groupemclem@gmail.com
N8N_BASIC_AUTH_PASSWORD=votre_mot_de_passe

# Application
NEXT_PUBLIC_APP_URL=https://www.talosprimes.com
NODE_ENV=production

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@talosprime.fr
RESEND_FROM_NAME=TalosPrime

# Twilio (optionnel)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33612345678
```

## ⚠️ IMPORTANT

1. **Ne jamais commiter** le fichier `.env.production` dans Git
2. Le fichier doit être créé directement sur le serveur dans `/var/www/talosprime/.env.production`
3. Vérifiez que le fichier `.gitignore` contient `.env.production`
4. Les variables `NEXT_PUBLIC_*` sont exposées côté client, ne mettez pas de secrets dedans
5. `SUPABASE_SERVICE_ROLE_KEY` est SECRÈTE, ne jamais l'exposer




