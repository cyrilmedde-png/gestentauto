# 🔄 N8N Workflows Facturation - Guide Complet

Date: 2026-01-01

---

## 📋 WORKFLOWS CRÉÉS (6 total)

### 1. 📋 **envoyer-devis.json**
**Webhook**: `POST /envoyer-devis`

**Fonction**: Envoyer un devis par email au client

**Payload**:
```json
{
  "document_id": "uuid-du-devis",
  "customer_email": "client@example.com",
  "customer_name": "Nom Client"
}
```

**Workflow**:
1. Validation données (document_id, email, name)
2. Récupération document via API
3. Email HTML gradient bleu professionnel
4. Logging action
5. Réponse webhook

**Email**: Template HTML avec countdown validité, détails montants, bouton téléchargement PDF

---

### 2. 💰 **envoyer-facture.json**
**Webhook**: `POST /envoyer-facture`

**Fonction**: Envoyer une facture par email + mise à jour statut

**Payload**:
```json
{
  "document_id": "uuid-facture",
  "customer_email": "client@example.com",
  "customer_name": "Nom Client"
}
```

**Workflow**:
1. Validation données
2. Récupération document via API
3. Email HTML gradient vert avec échéance
4. **Mise à jour statut = 'sent' + sent_at**
5. Logging action
6. Réponse webhook

**Email**: Template avec alert box échéance, coordonnées bancaires, bouton paiement en ligne, mentions légales

---

### 3. ✅ **confirmation-paiement.json**
**Webhook**: `POST /confirmation-paiement`

**Fonction**: Confirmer réception paiement par email

**Payload**:
```json
{
  "document_id": "uuid-facture",
  "customer_email": "client@example.com",
  "customer_name": "Nom Client",
  "amount": 1500.00,
  "payment_method": "bank_transfer",
  "payment_date": "2026-01-15",
  "transaction_reference": "REF123"
}
```

**Workflow**:
1. Validation données (document_id, amount, email)
2. Récupération document via API
3. Email HTML confirmation avec icône ✅
4. Montant payé en gros (32px)
5. Calcul solde restant
6. Message spécial si payé intégralement
7. Logging action

**Email**: Template gradient vert, détails paiement, récapitulatif facture, bouton téléchargement reçu

---

### 4. ⏰ **relance-devis-j3.json**
**Trigger**: Cron quotidien à 9h

**Fonction**: Relancer automatiquement les devis qui expirent dans 3 jours

**Workflow**:
1. Cron déclenchement 9h
2. Récupération tous devis status 'sent'
3. **Filtrage JS**: expire dans exactement 3 jours
4. IF: A des devis à relancer ?
5. Email relance gradient orange avec countdown "3 JOURS"
6. Logging action
7. NoOp si aucun devis

**Email**: Template orange urgent, countdown visible, raisons d'agir (prix garantis, stocks), boutons accepter + télécharger

**Fréquence**: Automatique tous les jours à 9h

---

### 5. 🔔 **relance-factures-impayees.json**
**Trigger**: Cron quotidien à 10h

**Fonction**: Système de relance multi-niveaux pour factures impayées

**Workflow**:
1. Cron déclenchement 10h
2. Récupération toutes factures
3. **Filtrage JS intelligent** avec catégorisation:
   - J-3 : Rappel préventif (niveau 0)
   - J+7 : 1ère relance (niveau 1)
   - J+15 : 2ème relance (niveau 2)
   - J+30 : Dernière relance / Mise en demeure (niveau 3)
4. IF: A des factures ?
5. **Switch node** routing selon reminder_type
6. Email adapté au niveau d'escalade
7. Logging avec level adapté (info → warning)

**Emails Progressifs**:
- **Niveau 0 (J-3)**: 🔵 Bleu - Rappel aimable "échéance dans 3 jours"
- **Niveau 1 (J+7)**: 🟠 Orange - 1ère relance "impayée depuis 7 jours"
- **Niveau 2 (J+15)**: 🔴 Rouge - 2ème relance urgente + pénalités
- **Niveau 3 (J+30)**: ⛔ Rouge foncé - Mise en demeure + CC admin + procédure 8j

**Fréquence**: Automatique tous les jours à 10h

---

### 6. 📄 **generer-pdf-document.json**
**Webhook**: `POST /generer-pdf`

**Fonction**: Générer PDF professionnel A4 pour tout type de document

**Payload**:
```json
{
  "document_id": "uuid-du-document"
}
```

**Workflow**:
1. Validation document_id
2. Récupération document + items via API
3. Récupération billing_settings via API
4. **Génération HTML complet** (Code node JS ~300 lignes)
5. Conversion HTML → PDF (API html2pdf.app)
6. Sauvegarde URL PDF dans document
7. Logging génération
8. Réponse webhook avec pdf_url

**Template PDF**:
- Format A4 professionnel
- Header avec logo + gradient couleur par type
- Parties émetteur/client
- Dates (émission, échéance, validité)
- Tableau items détaillé
- Totaux HT/TVA/TTC
- Reste à payer si paiement partiel
- Notes + modalités paiement
- Coordonnées bancaires
- Footer avec mentions légales
- Support 5 types documents (couleurs différentes)

---

## 🎨 DESIGN & STYLES

### Templates Emails
- **Responsive**: Max-width 600px
- **Typography**: Arial, Segoe UI
- **Gradients modernes**: linear-gradient par type
- **Boxes**: Border-left coloré + border-radius 8px
- **Boutons CTA**: Padding 15px 30px, hover effects
- **Footer**: Mentions légales + contact
- **Emojis**: Pour clarté visuelle

### PDF
- **Format**: A4 (210x297mm)
- **Padding**: 20mm
- **Typography**: Segoe UI 11pt
- **Colors**: Gradient header par type document
- **Layout**: 2 colonnes parties, tableau items, totaux float right
- **Print-ready**: @page, @media print

---

## 🔗 INTÉGRATIONS API

### APIs Utilisées
- `GET /api/billing/documents/[id]` - Récupérer document + items
- `PUT /api/billing/documents/[id]` - Mettre à jour statut/pdf_url
- `GET /api/billing/settings` - Récupérer paramètres entreprise
- `POST /api/subscription-logs/log` - Logger actions

### Services Externes
- **Resend SMTP**: Envoi emails (smtp.resend.com)
- **HTML2PDF API**: Conversion HTML → PDF (html2pdf.app)
- **Alternative PDF**: pdfapi.io, Puppeteer local

---

## 🔧 CONFIGURATION N8N

### Credentials Nécessaires
1. **Resend SMTP**
   - ID: 2
   - Name: "Resend SMTP"
   - Host: smtp.resend.com
   - Port: 465
   - Secure: true
   - User: resend
   - Password: re_xxxxx

2. **Supabase Service Key**
   - ID: 1
   - Name: "Supabase Service Key"
   - Type: HTTP Header Auth
   - Header: apikey
   - Value: eyJxxxx (service_role key)

### Webhooks URLs
```
https://n8n.talosprimes.com/webhook/envoyer-devis
https://n8n.talosprimes.com/webhook/envoyer-facture
https://n8n.talosprimes.com/webhook/confirmation-paiement
https://n8n.talosprimes.com/webhook/generer-pdf
```

### Crons
- **Relance devis**: Tous les jours à 9h
- **Relance factures**: Tous les jours à 10h

---

## 📊 LOGS & MONITORING

### Actions Loggées
```typescript
{
  action: 'devis_envoye' | 'facture_envoyee' | 'paiement_recu' | 'relance_devis' | 'relance_facture' | 'pdf_genere',
  level: 'info' | 'success' | 'warning',
  message: string,
  metadata: {
    document_id: string,
    document_number: string,
    customer_email?: string,
    amount?: number,
    reminder_level?: number,
    days_overdue?: number,
    pdf_url?: string
  }
}
```

### Consultation Logs
```
Dashboard: /platform/logs
Filtres: action, level, date
```

---

## 🧪 TESTS

### 1. Test Envoi Devis
```bash
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-devis",
    "customer_email": "test@example.com",
    "customer_name": "Test Client"
  }'
```

**Résultat attendu**:
- Email reçu avec template bleu
- Log créé avec action='devis_envoye'
- Réponse: `{ success: true, message: '...' }`

### 2. Test Envoi Facture
```bash
curl -X POST https://n8n.talosprimes.com/webhook/envoyer-facture \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-facture",
    "customer_email": "test@example.com",
    "customer_name": "Test Client"
  }'
```

**Résultat attendu**:
- Email reçu avec template vert
- Statut document = 'sent'
- sent_at mis à jour
- Log créé

### 3. Test Confirmation Paiement
```bash
curl -X POST https://n8n.talosprimes.com/webhook/confirmation-paiement \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-facture",
    "customer_email": "test@example.com",
    "customer_name": "Test Client",
    "amount": 1500.00,
    "payment_method": "bank_transfer"
  }'
```

**Résultat attendu**:
- Email confirmation reçu
- Calcul solde correct
- Message si payé intégralement
- Log créé

### 4. Test Génération PDF
```bash
curl -X POST https://n8n.talosprimes.com/webhook/generer-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-document"
  }'
```

**Résultat attendu**:
- PDF généré (A4)
- URL sauvegardée dans document.pdf_url
- Log créé
- Réponse: `{ success: true, pdf_url: '...', document_number: '...' }`

### 5. Test Relances (Manuel)
1. Créer devis expirant dans 3 jours exactement
2. Attendre 9h ou déclencher manuellement le workflow
3. Vérifier email reçu

1. Créer facture échue depuis 7 jours
2. Attendre 10h ou déclencher manuellement
3. Vérifier email 1ère relance reçu

---

## ⚠️ TROUBLESHOOTING

### Email non envoyé
- **Vérifier Resend credentials**
- **Vérifier domaine vérifié** (noreply@talosprimes.com)
- **Consulter logs N8N**

### PDF non généré
- **Vérifier API html2pdf.app disponible**
- **Vérifier HTML valide** (tester dans browser)
- **Alternative**: Utiliser pdfapi.io ou Puppeteer

### Relances ne se déclenchent pas
- **Vérifier cron activé** (toggle ON dans N8N)
- **Vérifier timezone** (UTC vs Paris)
- **Tester manuellement** (bouton Execute dans N8N)

### Variables non interprétées
- **Syntax N8N**: `={{ $json.variable }}` (pas `${}`)
- **Body variables**: `={{ $json.body.variable }}`
- **Vérifier chemins** dans console N8N

---

## 📚 RESSOURCES

### Documentation N8N
- https://docs.n8n.io/workflows/
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/

### APIs Externes
- Resend: https://resend.com/docs
- HTML2PDF: https://html2pdf.app/docs
- Alternative: https://pdfapi.io

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] Import workflows dans N8N
- [ ] Configurer credentials (Resend, Supabase)
- [ ] Vérifier webhooks URLs
- [ ] Activer crons (toggle ON)
- [ ] Tester chaque workflow
- [ ] Vérifier emails reçus
- [ ] Vérifier logs créés
- [ ] Vérifier PDF généré
- [ ] Tester relances manuellement
- [ ] Monitorer logs N8N 24h

---

## 🎉 RÉSUMÉ

**6 workflows créés**:
- 3 envoi emails (devis, facture, paiement)
- 2 relances auto (devis, factures multi-niveaux)
- 1 génération PDF (template A4 professionnel)

**Automatisation complète**:
- ✅ Emails HTML professionnels
- ✅ Relances intelligentes
- ✅ PDF sur mesure
- ✅ Logging centralisé
- ✅ Gestion erreurs

**Production-ready ! 🚀**

