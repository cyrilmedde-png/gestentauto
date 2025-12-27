# 🚀 Guide rapide : Configurer DNS Resend dans IONOS

## 📍 Où trouver les valeurs à ajouter ?

1. Allez sur [Resend - Domaines](https://resend.com/domains)
2. Cliquez sur votre domaine `noreply.talosprime.fr`
3. Vous verrez les enregistrements DNS à ajouter avec leurs valeurs exactes

## 🔧 Dans IONOS, ajoutez ces enregistrements :

### 1️⃣ DKIM (Vérification)

**Dans IONOS :**
- Type : `TXT`
- Host : `resend._domainkey.noreply` (ou juste copiez exactement ce que Resend vous montre)
- Valeur : La longue clé publique (commence par `p=MIGfMA0GCSqGSIb3...`)
- TTL : `3600` ou Auto

### 2️⃣ MX (Envoi)

**Dans IONOS :**
- Type : `MX`
- Host : `send.noreply`
- Valeur : `feedback-smtp.eu-west-1.amazonses.com` (copiez la valeur exacte de Resend)
- Priorité : `10`
- TTL : `3600` ou Auto

### 3️⃣ SPF (Envoi)

**Dans IONOS :**
- Type : `TXT`
- Host : `send.noreply`
- Valeur : `v=spf1 include:amazonses.com ~all` (copiez la valeur exacte de Resend)
- TTL : `3600` ou Auto

### 4️⃣ DMARC (Optionnel)

**Dans IONOS :**
- Type : `TXT`
- Host : `_dmarc.noreply`
- Valeur : `v=DMARC1; p=none;`
- TTL : `3600` ou Auto

## ⏱️ Après ajout

1. Attendez 15-30 minutes (propagation DNS)
2. Retournez dans Resend
3. Cliquez sur **"Vérifier"** ou attendez la vérification automatique
4. Les statuts doivent passer de **"En Attente"** (orange) à **"Vérifié"** (vert) ✅

## 🎯 Alternative rapide pour tester

Si vous voulez tester tout de suite sans configurer DNS :

Dans votre `.env.production`, changez temporairement :
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Cela fonctionne immédiatement, mais c'est limité (idéal pour les tests).

Une fois votre domaine vérifié, remettez :
```env
RESEND_FROM_EMAIL=info@noreply.talosprime.fr
```





