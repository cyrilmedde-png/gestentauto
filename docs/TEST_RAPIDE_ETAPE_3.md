# ⚡ TEST RAPIDE ÉTAPE 3 (5 min)

---

## 🎯 WORKFLOW À IMPORTER

**1 seul workflow** : `upgrade-downgrade-plan.json`

**Localisation** : `n8n-workflows/abonnements/upgrade-downgrade-plan.json`

---

## 📥 IMPORT (1 min)

1. Dans N8N : **"+"** → **"Import from File"**
2. Sélectionnez : `upgrade-downgrade-plan.json`
3. **Importez**

---

## ✏️ CORRECTION VARIABLES (2 min)

### Nodes à modifier

**3 nodes principaux** :
1. "Validation Données" (IF node)
2. "Email Confirmation" (HTTP Request)
3. "SMS Confirmation" (HTTP Request - optionnel)

### Correction à faire

**Partout où vous voyez** :
```
{{$json.email}}
{{$json.first_name}}
{{$json.old_plan_name}}
{{$json.new_plan_name}}
{{$json.old_price}}
{{$json.new_price}}
{{$json.prorated_amount}}
{{$json.next_billing_date}}
```

**Remplacez par** (ajoutez `.body`) :
```
{{$json.body.email}}
{{$json.body.first_name}}
{{$json.body.old_plan_name}}
{{$json.body.new_plan_name}}
{{$json.body.old_price}}
{{$json.body.new_price}}
{{$json.body.prorated_amount}}
{{$json.body.next_billing_date}}
```

---

## ✅ ACTIVATION (30 sec)

1. **Save** le workflow
2. **Activate** (toggle ON en haut à droite)
3. Vérifiez le webhook : `/webhook/changement-formule`

---

## 🧪 TEST UPGRADE (1 min)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/changement-formule \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "upgrade",
    "email": "VOTRE_EMAIL@exemple.com",
    "first_name": "Test",
    "last_name": "User",
    "change_type": "upgrade",
    "old_plan_name": "Starter",
    "new_plan_name": "Business",
    "old_price": 29,
    "new_price": 99,
    "prorated_amount": 70,
    "next_billing_date": "2026-02-01T00:00:00Z",
    "subscription_id": "sub_test123"
  }'
```

**Résultat attendu** :
```json
{"success": true, "message": "Workflow executed"}
```

**Vérifiez votre email** :
- ✅ Email reçu
- ✅ "Starter → Business"
- ✅ "70€" de prorata
- ✅ Variables interprétées (pas de `{{...}}` dans l'email)

---

## 🧪 TEST DOWNGRADE (1 min)

```bash
curl -X POST https://n8n.talosprimes.com/webhook/changement-formule \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "downgrade",
    "email": "VOTRE_EMAIL@exemple.com",
    "first_name": "Test",
    "last_name": "User",
    "change_type": "downgrade",
    "old_plan_name": "Business",
    "new_plan_name": "Starter",
    "old_price": 99,
    "new_price": 29,
    "prorated_amount": 70,
    "next_billing_date": "2026-02-01T00:00:00Z",
    "subscription_id": "sub_test123"
  }'
```

**Résultat attendu** :
```json
{"success": true, "message": "Workflow executed"}
```

**Vérifiez votre email** :
- ✅ Email reçu
- ✅ "Business → Starter"
- ✅ Mention "crédité"

---

## ✅ SUCCÈS SI...

- [ ] `curl` retourne `{"success": true}`
- [ ] Email reçu pour upgrade
- [ ] Email reçu pour downgrade
- [ ] Variables interprétées correctement
- [ ] Pas de `{{...}}` dans l'email

---

## ❌ SI ERREUR...

### `{"success":false,"message":"Données invalides"}`

**→** Vous avez oublié d'ajouter `.body` quelque part

**Solution rapide** :
1. Node "Validation Données"
2. Conditions → Remplacez `{{$json.email}}` par `{{$json.body.email}}`
3. Save + Toggle OFF/ON

---

### Variables non interprétées dans email

**→** Mauvaise syntaxe dans le HTML

**Solution rapide** :
1. Node "Email Confirmation"
2. Remplacez tous les `{{$json.variable}}` par `{{$json.body.variable}}`
3. Vérifiez qu'il n'y a pas de `${variable}` ou `{{ variable }}`
4. Save + Re-test

---

## 🎉 ÉTAPE 3 TERMINÉE !

**Temps total** : 5 minutes

**Prochaine étape** : ÉTAPE 4 - Crons (rappels J-7)

---

**Dernière mise à jour** : 1er janvier 2026

