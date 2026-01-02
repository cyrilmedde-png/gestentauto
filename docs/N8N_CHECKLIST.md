# 🎯 Configuration N8N - CHECKLIST SIMPLE

## ✅ ÉTAPE 1 : CREDENTIALS (2 minutes)

### A. Supabase Service Key
```
1. N8N > Credentials > New > HTTP Header Auth
2. Name: Supabase Service Key
3. Header Name: apikey
4. Header Value: [ta clé depuis Supabase > Settings > API]
5. Create
```

### B. Resend SMTP
```
1. N8N > Credentials > New > SMTP
2. Name: Resend SMTP
3. Host: smtp.resend.com
4. Port: 465
5. Secure: ✅
6. User: resend
7. Password: [ta clé depuis resend.com/api-keys]
8. From: noreply@talosprimes.com
9. Create
```

---

## ✅ ÉTAPE 2 : IMPORTER WORKFLOWS (5 minutes)

### Pour CHAQUE workflow (6 au total) :

```
1. Workflows > Import from File
2. Sélectionner fichier .json
3. Assigner credentials aux nodes
4. Save (Ctrl+S)
5. Toggle "Active" (vert)
```

### Liste des 6 fichiers :
```
✅ n8n-workflows/facturation/envoyer-devis.json
✅ n8n-workflows/facturation/envoyer-facture.json
✅ n8n-workflows/facturation/confirmation-paiement.json
✅ n8n-workflows/facturation/relance-devis-j3.json
✅ n8n-workflows/facturation/relance-factures-impayees.json
✅ n8n-workflows/facturation/generer-pdf-document.json
```

---

## ✅ ÉTAPE 3 : VÉRIFICATION (1 minute)

```
Menu Workflows → 6 workflows avec toggle vert ✅
Menu Credentials → 2 credentials présentes ✅
```

---

## 🧪 TEST RAPIDE

```bash
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test",
    "customer_email": "meddecyril@icloud.com",
    "customer_name": "Test"
  }'
```

**Si erreur 404** → Workflow pas activé  
**Si erreur workflow** → Credentials manquantes  
**Si success** → ✅ Tout fonctionne !

---

## 📱 URLs WEBHOOKS

Une fois configuré, noter ces URLs :

```
https://n8n.talosprimes.com/webhook/envoyer-devis
https://n8n.talosprimes.com/webhook/envoyer-facture
https://n8n.talosprimes.com/webhook/confirmation-paiement
https://n8n.talosprimes.com/webhook/generer-pdf
```

**Crons automatiques** :
- Relance devis : 9h chaque jour
- Relance factures : 10h chaque jour

---

## ✅ C'EST TOUT !

**Temps total** : 8 minutes  
**Résultat** : Module facturation 100% automatisé ! 🚀

