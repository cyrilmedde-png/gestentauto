# 🔄 Workflow N8N - Création Lead Complet

## 📋 Description

Ce workflow N8N permet de créer un lead complet avec toutes les notifications automatiques :
- ✅ Validation des données entrantes
- ✅ Création du lead dans la base de données
- ✅ Envoi d'un email de bienvenue
- ✅ Envoi d'un SMS de confirmation
- ✅ Notification Slack (optionnel)
- ✅ Réponse webhook avec le résultat

---

## 📥 Installation

### **1. Importer le workflow dans N8N**

1. Ouvrez N8N : `https://n8n.talosprimes.com`
2. Cliquez sur **"Workflows"** dans le menu
3. Cliquez sur **"Add workflow"** → **"Import from file"**
4. Sélectionnez le fichier : `n8n-workflows/creation-lead-complet.json`
5. Cliquez sur **"Import"**

---

### **2. Configuration du workflow**

#### **A. Webhook Trigger**
- **Path** : `nouveau-lead` (déjà configuré)
- **URL finale** : `https://n8n.talosprimes.com/webhook/nouveau-lead`
- **Méthode** : POST

#### **B. Validation Données**
Vérifie que les champs obligatoires sont présents :
- `first_name`
- `last_name`
- `email`

**Aucune modification nécessaire.**

#### **C. Créer Lead API**
- **URL** : `https://www.talosprimes.com/api/platform/leads`
- **Méthode** : POST

**Paramètres envoyés :**
```json
{
  "first_name": "{{ $json.body.first_name }}",
  "last_name": "{{ $json.body.last_name }}",
  "email": "{{ $json.body.email }}",
  "phone": "{{ $json.body.phone }}",
  "company": "{{ $json.body.company }}",
  "source": "{{ $json.body.source || 'web' }}",
  "notes": "{{ $json.body.notes }}",
  "status": "new"
}
```

#### **D. Envoyer Email Bienvenue**
- **URL** : `https://www.talosprimes.com/api/email/send`
- **Configuration Resend** : Vérifiez que l'API email fonctionne

**Personnalisez le template** :
1. Cliquez sur le nœud "Envoyer Email Bienvenue"
2. Modifiez le HTML dans le champ `html`
3. Ajoutez votre logo, couleurs, etc.

#### **E. Envoyer SMS Confirmation**
- **URL** : `https://www.talosprimes.com/api/sms/send`
- **Configuration Twilio** : Vérifiez que l'API SMS fonctionne

**Personnalisez le message** :
1. Cliquez sur le nœud "Envoyer SMS Confirmation"
2. Modifiez le message
3. Respectez la limite de 160 caractères

#### **F. Notifier Slack (Optionnel)**

**Si vous voulez recevoir les notifications Slack :**

1. Créez un Webhook Slack :
   - Allez sur `https://api.slack.com/apps`
   - Créez une app → "Incoming Webhooks"
   - Copiez l'URL du webhook

2. Dans N8N, cliquez sur le nœud "Notifier Slack"
3. Remplacez l'URL par votre webhook Slack
4. Personnalisez le message

**Si vous ne voulez pas Slack :**
- Supprimez le nœud "Notifier Slack"
- Connectez "Attendre 2s" directement à "Réponse Succès"

---

### **3. Activer le workflow**

1. Cliquez sur le bouton **"Active"** en haut à droite
2. Le workflow est maintenant en écoute sur le webhook

---

## 🧪 Test du workflow

### **Test depuis le terminal**

```bash
curl -X POST https://n8n.talosprimes.com/webhook/nouveau-lead \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678",
    "company": "ACME Corp",
    "source": "web",
    "notes": "Intéressé par nos services"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Lead créé avec succès",
  "lead_id": "uuid-du-lead"
}
```

---

### **Test depuis votre application**

```typescript
// Dans votre application Next.js
async function createLead(leadData: any) {
  const response = await fetch('https://n8n.talosprimes.com/webhook/nouveau-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
  })

  const result = await response.json()
  console.log('Lead créé:', result)
  return result
}

// Utilisation
await createLead({
  first_name: 'Marie',
  last_name: 'Martin',
  email: 'marie@example.com',
  phone: '+33687654321',
  company: 'Startup Inc',
  source: 'referral',
  notes: 'Recommandé par un client'
})
```

---

## 📊 Flux du workflow

```
Webhook Nouveau Lead
    ↓
Validation Données
    ↓ (si valide)              ↓ (si invalide)
Créer Lead API           →  Réponse Erreur (400)
    ↓
    ├──→ Envoyer Email Bienvenue
    ├──→ Envoyer SMS Confirmation
    └──→ Attendre 2s
            ↓
        Notifier Slack (optionnel)
            ↓
        Réponse Succès (200)
```

---

## 🔧 Personnalisation

### **Ajouter des champs**

1. Modifiez le nœud "Validation Données"
2. Ajoutez votre validation
3. Modifiez "Créer Lead API" pour inclure le nouveau champ

### **Ajouter une notification Discord**

1. Ajoutez un nœud "HTTP Request"
2. Configurez avec l'URL webhook Discord
3. Connectez-le après "Créer Lead API"

### **Ajouter Google Sheets**

1. Ajoutez un nœud "Google Sheets"
2. Configurez vos credentials
3. Insérez une ligne avec les données du lead

### **Ajouter un CRM (HubSpot, Salesforce)**

1. Ajoutez le nœud du CRM
2. Configurez vos credentials
3. Mappez les champs du lead

---

## 🐛 Dépannage

### **Erreur : "Webhook not found"**

✅ **Solution :**
- Vérifiez que le workflow est **activé** (bouton "Active")
- Vérifiez le path du webhook : `/webhook/nouveau-lead`

### **Erreur : "Lead non créé"**

✅ **Solution :**
- Vérifiez que l'API leads fonctionne :
  ```bash
  curl -I https://www.talosprimes.com/api/platform/leads
  ```
- Vérifiez les credentials Supabase dans votre app

### **Email non reçu**

✅ **Solution :**
- Vérifiez la configuration Resend (clé API)
- Vérifiez que l'email est valide
- Regardez les logs N8N pour voir l'erreur

### **SMS non reçu**

✅ **Solution :**
- Vérifiez la configuration Twilio
- Vérifiez le format du numéro : `+33XXXXXXXXX`
- Vérifiez votre crédit Twilio

---

## 📈 Voir les exécutions

1. Dans N8N, cliquez sur **"Executions"** dans le menu
2. Vous verrez toutes les exécutions du workflow
3. Cliquez sur une exécution pour voir les détails
4. Les nœuds en vert = réussi, en rouge = erreur

---

## 🔒 Sécurité

### **Ajouter une authentification**

Pour protéger votre webhook :

1. Ajoutez un nœud "IF" après le webhook
2. Vérifiez un token d'authentification :
   ```javascript
   {{ $json.headers.authorization === 'Bearer VOTRE_TOKEN_SECRET' }}
   ```
3. Si invalide, renvoyez une erreur 401

### **Limiter les requêtes**

1. Ajoutez un nœud "Redis" ou "Memory"
2. Vérifiez le nombre de requêtes par IP
3. Bloquez si trop de requêtes

---

## 📝 Exemple de formulaire frontend

```typescript
'use client'

import { useState } from 'react'

export function CreateLeadForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('https://n8n.talosprimes.com/webhook/nouveau-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          company: formData.get('company'),
          source: 'web',
          notes: formData.get('notes'),
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Lead créé avec succès ! Vous allez recevoir un email.')
        e.currentTarget.reset()
      } else {
        alert('Erreur : ' + result.message)
      }
    } catch (error) {
      alert('Erreur lors de la création du lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="first_name" placeholder="Prénom" required />
      <input name="last_name" placeholder="Nom" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="phone" type="tel" placeholder="Téléphone" required />
      <input name="company" placeholder="Entreprise" />
      <textarea name="notes" placeholder="Message" />
      <button type="submit" disabled={loading}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  )
}
```

---

## 🎯 Résumé

✅ **Workflow prêt à l'emploi**  
✅ **Notifications automatiques** (email + SMS)  
✅ **Extensible** (ajoutez facilement des nœuds)  
✅ **Testé et fonctionnel**

**Importez, configurez, testez, et c'est parti ! 🚀**

