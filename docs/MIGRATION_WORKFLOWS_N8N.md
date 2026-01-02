# 🔄 MISE À JOUR WORKFLOW N8N - Nouvelles Routes API

## 🎯 CE QU'IL FAUT CHANGER

Votre workflow utilise actuellement :
```
❌ https://www.talosprimes.com/api/billing/documents/...
```

Il faut changer pour :
```
✅ https://www.talosprimes.com/api/n8n/billing/documents/...
```

**Simple changement** : Ajouter `/n8n` après `/api` ! 🚀

---

## 📝 ÉTAPES DANS N8N

### 1. Ouvrir le Workflow

```
1. Menu : Workflows
2. Ouvrir : "Envoyer Devis par Email" (ou celui en cours)
```

### 2. Modifier le Node "Récupérer Document"

```
1. Cliquer sur le node "Récupérer le document"
2. Dans le champ "URL", changer :

   ❌ Ancien :
   https://www.talosprimes.com/api/billing/documents/={{ $json.body.document_id }}
   
   ✅ Nouveau :
   https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}

3. Vérifier que "Authentication" = "Header Auth"
4. Credential = "Supabase Service Key"
5. Fermer le node
```

### 3. Sauvegarder

```
1. Bouton "Save" (Ctrl+S)
2. Workflow prêt !
```

---

## 🧪 TEST RAPIDE

### Test depuis le VPS

```bash
# 1. Récupérer la service_role key
cd /var/www/talosprime
cat .env.production | grep SUPABASE_SERVICE_ROLE_KEY

# 2. Tester la nouvelle route
curl https://www.talosprimes.com/api/n8n/billing/documents/test-id \
  -H "apikey: [votre-service-role-key]"
```

**Résultat attendu** :
- ✅ `{ "success": false, "error": "Document non trouvé" }`
- ✅ (Normal car test-id n'existe pas)
- ✅ Mais **PAS** d'erreur "Authorization failed" !

---

## 📊 ROUTES À UTILISER PAR WORKFLOW

### Workflow 1 : Envoyer Devis

**Node "Récupérer Document"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}
Method : GET
Auth : Header Auth → Supabase Service Key
```

---

### Workflow 2 : Envoyer Facture

**Node "Récupérer Document"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}
```

**Node "Mettre à jour statut"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}/status
Method : PUT
Auth : Header Auth → Supabase Service Key
Body : {
  "status": "sent",
  "sent_at": "={{ $now.toISOString() }}"
}
```

---

### Workflow 3 : Confirmation Paiement

**Node "Récupérer Document"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}
```

---

### Workflow 4 : Relance Devis J-3

**Node "Récupérer Devis"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/quotes/expiring?days=3
Method : GET
Auth : Header Auth → Supabase Service Key
```

---

### Workflow 5 : Relances Factures

**Node "Récupérer Factures"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/invoices/reminders
Method : GET
Auth : Header Auth → Supabase Service Key
```

---

### Workflow 6 : Générer PDF

**Node "Récupérer Document + Items"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.body.document_id }}
```

**Node "Récupérer Paramètres"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/settings/={{ $json.company_id }}
Method : GET
Auth : Header Auth → Supabase Service Key
```

**Node "Sauvegarder URL PDF"** :
```
URL : https://www.talosprimes.com/api/n8n/billing/documents/={{ $json.document.id }}/pdf
Method : PUT
Auth : Header Auth → Supabase Service Key
Body : {
  "pdf_url": "={{ $json.pdf_url }}"
}
```

---

## ✅ CHECKLIST

Pour CHAQUE workflow :

- [ ] Ouvrir le workflow
- [ ] Trouver nodes "HTTP Request" qui appellent `/api/billing/`
- [ ] Changer l'URL pour `/api/n8n/billing/`
- [ ] Vérifier Authentication = "Header Auth"
- [ ] Vérifier Credential = "Supabase Service Key"
- [ ] Save
- [ ] Tester (Execute Workflow)

---

## 🎉 APRÈS MISE À JOUR

Une fois les 6 workflows mis à jour :

1. ✅ Plus d'erreur "Authorization failed"
2. ✅ Les workflows peuvent accéder aux données
3. ✅ Authentification fonctionne
4. ✅ Prêt pour tests complets !

---

## 🚀 DÉPLOIEMENT VPS

Les routes sont déjà déployées ! Il suffit de :

```bash
ssh root@62.171.152.132
cd /var/www/talosprime
git pull origin main
npm run build
pm2 restart talosprime
```

**Les routes `/api/n8n/...` sont maintenant disponibles !** ✅

---

**Mettez à jour votre premier workflow et testez ! 💪**

