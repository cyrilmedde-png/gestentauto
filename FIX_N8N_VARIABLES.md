# 🔧 Fix Variables N8N - Guide Rapide

## ❌ Le Problème

Les emails affichent littéralement les variables au lieu des valeurs :
```
Bonjour {{ $json.body.first_name }} {{ $json.body.last_name }}
```

Au lieu de :
```
Bonjour Sophie MARTIN
```

---

## ✅ La Solution

**Les workflows N8N ont été corrigés** ! Les variables sont maintenant correctement référencées.

**Changement** : `$json.body.XXX` → `$json.XXX`

---

## 📋 Instructions de Réimportation

### **Sur https://n8n.talosprimes.com** :

#### **1. Supprimer les anciens workflows**

**Workflow 1 : "Inscription Lead"**
1. Cliquez sur le workflow "Inscription Lead (Pré-inscription)"
2. En haut à droite, cliquez sur "..." → "Delete"
3. Confirmez

**Workflow 2 : "Créer Essai"**
1. Cliquez sur le workflow "Créer Essai (Envoi Identifiants)"
2. En haut à droite, cliquez sur "..." → "Delete"
3. Confirmez

---

#### **2. Réimporter les workflows corrigés**

**Workflow 1 : Inscription Lead**
1. Cliquez sur "+" → "Import from File"
2. Sélectionnez : `n8n-workflows/inscription-lead.json`
3. Cliquez sur "Import"
4. **ACTIVER** (bouton vert en haut à droite)
5. Cliquez sur "Save"

**Workflow 2 : Créer Essai**
1. Cliquez sur "+" → "Import from File"
2. Sélectionnez : `n8n-workflows/creer-essai.json`
3. Cliquez sur "Import"
4. **ACTIVER** (bouton vert en haut à droite)
5. Cliquez sur "Save"

---

## 🧪 Test

### **Test 1 : Tester le webhook manuellement**

```bash
curl -X POST https://n8n.talosprimes.com/webhook/inscription-lead \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "CORRECTION",
    "email": "test.correction@example.com",
    "phone": "+33600000999",
    "company_name": "Test Fix",
    "lead_id": "test-123"
  }'
```

**Résultat attendu** : Email reçu avec "Bonjour **Test CORRECTION**" (et non `{{ $json.first_name }}`)

### **Test 2 : Nouvelle inscription**

1. Allez sur `https://www.talosprimes.com/auth/register`
2. Inscrivez-vous avec un **nouvel email**
3. Vérifiez l'email reçu
4. Les variables doivent être correctement remplacées

---

## ✅ Checklist

- [ ] Anciens workflows supprimés de N8N
- [ ] `inscription-lead.json` réimporté et **ACTIVÉ**
- [ ] `creer-essai.json` réimporté et **ACTIVÉ**
- [ ] Test webhook manuel → Variables correctement affichées
- [ ] Test inscription → Email avec vraies valeurs

---

## 📊 Avant / Après

### **Avant** ❌
```
Bonjour {{ $json.body.first_name }} {{ $json.body.last_name }},
Email : {{ $json.body.email }}
Téléphone : {{ $json.body.phone }}
```

### **Après** ✅
```
Bonjour Sophie MARTIN,
Email : sophie.martin@example.com
Téléphone : +33612345678
```

---

**C'est tout ! Les workflows sont maintenant corrigés et prêts à l'emploi ! 🚀**

