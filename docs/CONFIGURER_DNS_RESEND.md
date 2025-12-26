# 🔧 Configuration DNS Resend pour noreply.talosprime.fr

## 📋 Vue d'ensemble

Pour que Resend puisse envoyer des emails depuis `noreply.talosprime.fr`, vous devez ajouter plusieurs enregistrements DNS dans IONOS.

## 🎯 Étape par étape

### 1. Accéder aux DNS dans IONOS

1. Connectez-vous à [IONOS](https://my.ionos.fr)
2. Allez dans **Domaines** → Sélectionnez `talosprime.fr`
3. Cliquez sur **Gestion DNS** ou **Enregistrements DNS**

### 2. Ajouter les enregistrements DNS

Vous devez ajouter **4 types d'enregistrements** selon ce que Resend vous indique dans son interface.

#### A. DKIM (Vérification de domaine)

**Type :** `TXT`  
**Nom/Host :** `resend._domainkey.noreply`  
**Valeur :** La clé publique fournie par Resend (commence par `p=MIGfMA0GCSqGSIb3...`)  
**TTL :** `3600` (ou Auto)

**Note :** Dans IONOS, si vous voyez déjà un enregistrement avec un nom similaire, vous pouvez soit le modifier, soit créer un nouveau sous-domaine spécifique pour Resend.

#### B. MX (Pour l'envoi)

**Type :** `MX`  
**Nom/Host :** `send.noreply`  
**Valeur :** `feedback-smtp.eu-west-1.amazonses.com` (ou la valeur exacte que Resend vous donne)  
**Priorité :** `10`  
**TTL :** `3600` (ou Auto)

#### C. SPF (Pour l'envoi)

**Type :** `TXT`  
**Nom/Host :** `send.noreply`  
**Valeur :** `v=spf1 include:amazonses.com ~all` (ou la valeur exacte que Resend vous donne)  
**TTL :** `3600` (ou Auto)

**Note :** Si vous avez déjà un enregistrement SPF pour `noreply`, vous devez le modifier pour inclure `include:amazonses.com`.

#### D. DMARC (Optionnel mais recommandé)

**Type :** `TXT`  
**Nom/Host :** `_dmarc.noreply`  
**Valeur :** `v=DMARC1; p=none;`  
**TTL :** `3600` (ou Auto)

## 📝 Instructions détaillées pour IONOS

### Comment ajouter un enregistrement dans IONOS :

1. Dans la page **Gestion DNS** d'IONOS
2. Cliquez sur le bouton **+** ou **Ajouter un enregistrement**
3. Sélectionnez le type d'enregistrement (TXT, MX, etc.)
4. Remplissez les champs :
   - **Host/Nom :** Le nom fourni par Resend (ex: `resend._domainkey.noreply`)
   - **Valeur :** La valeur fournie par Resend
   - **TTL :** `3600` ou laissez par défaut
   - **Priorité :** Pour MX uniquement (ex: `10`)
5. Cliquez sur **Sauvegarder**

## ⏱️ Délai de propagation

- **Propagation DNS :** 5 minutes à 48 heures (généralement 15-30 minutes)
- **Vérification Resend :** Après la propagation, revenez dans Resend et cliquez sur **Vérifier** ou attendez la vérification automatique

## ✅ Vérification

### Dans Resend :

1. Retournez dans l'interface Resend
2. Allez dans **Domaines** → `noreply.talosprime.fr`
3. Les statuts doivent passer de **"En Attente"** à **"Vérifié"** (vert)

### Tester l'envoi :

Une fois vérifié, testez l'envoi d'email :
```bash
curl -X POST http://localhost:3000/api/email/test?to=votre-email@example.com
```

## ⚠️ Notes importantes

1. **Sous-domaine vs domaine principal :**
   - Vous configurez pour `noreply.talosprime.fr` (sous-domaine)
   - Les enregistrements DNS doivent être au niveau du sous-domaine ou utiliser des noms complets

2. **Enregistrements existants :**
   - Si vous avez déjà des enregistrements MX ou SPF pour `noreply`, vous pouvez :
     - Les modifier pour inclure Resend
     - Ou créer un nouveau sous-domaine comme `send.noreply.talosprime.fr`

3. **Format des valeurs :**
   - Les valeurs TXT doivent être entre guillemets si elles contiennent des espaces
   - Copiez exactement ce que Resend vous donne (sans modifier)

## 🐛 Dépannage

### Les enregistrements ne se vérifient pas ?

1. **Vérifiez la propagation DNS :**
   ```bash
   # Depuis votre terminal
   dig TXT resend._domainkey.noreply.talosprime.fr
   dig MX send.noreply.talosprime.fr
   ```

2. **Vérifiez les noms :**
   - Assurez-vous que le nom/host correspond exactement à ce que Resend demande
   - Vérifiez qu'il n'y a pas de typo

3. **Vérifiez les valeurs :**
   - Copiez-collez exactement les valeurs de Resend
   - Pour TXT, vérifiez qu'il n'y a pas de guillemets en double

4. **Attendez la propagation :**
   - Les DNS peuvent prendre jusqu'à 48h (mais généralement 15-30 min)

## 🔄 Alternative : Utiliser le domaine par défaut de Resend

Si la configuration DNS est trop complexe, vous pouvez temporairement utiliser :
- **Email d'envoi :** `onboarding@resend.dev`
- Pas de configuration DNS nécessaire
- Limité (pour tests uniquement)

Puis configurez votre domaine plus tard pour la production.




