# 🧪 Tests rapides Email et SMS

## 📧 Test Email (Resend)

### Test simple depuis le serveur

```bash
# Connectez-vous au serveur
ssh cursor@82.165.129.143
cd /var/www/talosprime

# Test d'envoi d'email
curl "http://localhost:3000/api/email/test?to=votre-email@example.com"
```

**Réponse attendue :**
```json
{
  "message": "Test email sent successfully!",
  "messageId": "abc123..."
}
```

✅ Si vous recevez l'email, Resend fonctionne !

---

## 📱 Test SMS (Twilio)

### Test simple depuis le serveur

```bash
# Sur le serveur
curl "http://localhost:3000/api/sms/test?to=+33612345678"
```

⚠️ **Important** : Le numéro doit être au format international avec le préfixe `+` (ex: `+33612345678` pour la France)

**Réponse attendue :**
```json
{
  "success": true,
  "message": "SMS de test envoyé avec succès",
  "messageId": "SM1234567890abcdef"
}
```

✅ Si vous recevez le SMS sur votre téléphone, Twilio fonctionne !

---

## 🔄 Test complet : Créer un lead (Email + SMS)

### Test depuis votre machine locale ou le serveur

```bash
# Remplacez les valeurs par vos vraies informations
curl -X POST "https://talosprime.fr/api/platform/leads/test" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+33612345678",
    "first_name": "Test",
    "last_name": "User",
    "company_name": "Test Company"
  }'
```

**Ce que ça fait :**
1. Crée un lead dans la base de données
2. Envoie un email de confirmation de pré-inscription
3. Envoie un SMS de confirmation (si numéro fourni)

**Réponse attendue :**
```json
{
  "lead": {
    "id": "uuid...",
    "email": "test@example.com",
    "phone": "+33612345678",
    ...
  },
  "email": {
    "success": true,
    "messageId": "abc123..."
  }
}
```

---

## 🌐 Test depuis l'interface web

### 1. Test Email

Visitez dans votre navigateur :
```
https://talosprime.fr/api/email/test?to=votre-email@example.com
```

### 2. Test SMS

Visitez dans votre navigateur :
```
https://talosprime.fr/api/sms/test?to=+33612345678
```

---

## ✅ Checklist de vérification

### Email (Resend)
- [ ] Test `/api/email/test` retourne `success: true`
- [ ] Email reçu dans la boîte de réception
- [ ] Pas d'erreur dans les logs PM2

### SMS (Twilio)
- [ ] Test `/api/sms/test` retourne `success: true`
- [ ] SMS reçu sur le téléphone
- [ ] Pas d'erreur dans les logs PM2
- [ ] Numéro au format international (`+33...`)

### Configuration serveur
- [ ] Variables d'environnement présentes dans `.env.production`
- [ ] Rebuild effectué après modification des variables
- [ ] Application PM2 redémarrée
- [ ] Pas d'erreur dans `pm2 logs talosprime`

---

## 🐛 Dépannage

### Email ne fonctionne pas

1. **Vérifier les variables Resend :**
   ```bash
   cat .env.production | grep RESEND
   ```

2. **Vérifier les logs :**
   ```bash
   pm2 logs talosprime --lines 50 | grep -i email
   ```

3. **Vérifier le domaine Resend :**
   - Si vous utilisez `noreply@talosprime.fr`, assurez-vous que le domaine est vérifié dans Resend
   - En développement, utilisez `onboarding@resend.dev`

### SMS ne fonctionne pas

1. **Vérifier les variables Twilio :**
   ```bash
   cat .env.production | grep TWILIO
   ```

2. **Vérifier le format du numéro :**
   - Doit commencer par `+` (ex: `+33612345678`)
   - Format international obligatoire

3. **Vérifier les logs :**
   ```bash
   pm2 logs talosprime --lines 50 | grep -i sms
   ```

4. **Compte Twilio d'essai :**
   - En compte d'essai, vous ne pouvez envoyer qu'aux numéros vérifiés
   - Vérifiez votre numéro dans la console Twilio

### Erreur "environment variable not set"

1. **Vérifier que le fichier existe :**
   ```bash
   ls -la .env.production
   ```

2. **Vérifier le contenu :**
   ```bash
   cat .env.production
   ```

3. **Rebuild nécessaire :**
   ```bash
   pm2 stop talosprime
   rm -rf .next
   npm run build
   pm2 start npm --name "talosprime" -- start
   ```

---

## 📊 Vérifier les logs en temps réel

```bash
# Voir tous les logs
pm2 logs talosprime

# Voir seulement les 50 dernières lignes
pm2 logs talosprime --lines 50

# Suivre les logs en temps réel
pm2 logs talosprime --lines 0
```

---

## 🎯 Test du workflow complet d'onboarding

Pour tester le workflow complet avec emails et SMS automatiques :

1. **Créer un lead** (pré-inscription) → Email + SMS
2. **Compléter le questionnaire** → Email + SMS
3. **Programmer un entretien** → Email + SMS
4. **Démarrer l'essai** → Email + SMS avec identifiants

Voir `docs/TEST_ONBOARDING.md` pour les détails complets.

