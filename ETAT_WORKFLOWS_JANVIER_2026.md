# 🔄 ÉTAT DES WORKFLOWS N8N - Janvier 2026

**Date** : 2 Janvier 2026  
**Total Workflows** : 18  
**Workflows Actifs** : 4  
**Workflows Prêts** : 14

---

## 📊 RÉSUMÉ GLOBAL

| Catégorie | Workflows | Statut | Connexion App |
|-----------|-----------|--------|---------------|
| **Leads** | 3 | ✅ Production | ✅ Connectés |
| **Essais** | 1 | ✅ Production | ✅ Connectés |
| **Abonnements** | 7 | ✅ Production | ✅ Connectés |
| **Facturation** | 6 | 🟡 Prêts | ⏳ À configurer |
| **Monitoring** | 1 | ✅ Production | ✅ Connecté |
| **TOTAL** | **18** | - | - |

---

## ✅ WORKFLOWS EN PRODUCTION (12)

### 📊 1. LEADS (3 workflows)

#### `inscription-lead.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/inscription-lead`  
**Connexion App** : `/api/auth/register-lead`  
**Statut** : ✅ Actif et fonctionnel

**Actions** :
- Création lead dans `platform_leads`
- Email bienvenue au lead
- SMS au lead
- SMS notification admin
- Notification in-app admin

---

#### `creation-lead-complet.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/creation-lead-complet`  
**Connexion App** : API manuelle  
**Statut** : ✅ Actif

**Actions** :
- Création lead avec données complètes
- Email confirmation

---

#### `leads-management.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/leads-management`  
**Statut** : ✅ Actif

**Actions** :
- Gestion cycle de vie des leads

---

### 🧪 2. ESSAIS GRATUITS (1 workflow)

#### `creer-essai.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/creer-essai`  
**Connexion App** : `/api/platform/trials/create`  
**Statut** : ✅ Actif et fonctionnel

**Actions** :
- Activation essai gratuit
- Email bienvenue
- Credentials envoyés

---

### 💳 3. ABONNEMENTS STRIPE (7 workflows)

#### `creer-abonnement.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/abonnement-cree`  
**Trigger** : Stripe webhook → `/api/stripe/webhooks/stripe` (checkout.session.completed)  
**Statut** : ✅ Actif

**Actions** :
- Email bienvenue abonnement
- Récapitulatif plan + prix
- Lien plateforme

---

#### `renouveler-abonnement.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/renouveler-abonnement`  
**Trigger** : Stripe webhook (invoice.payment_succeeded)  
**Statut** : ✅ Actif

**Actions** :
- Email reçu paiement
- Détails facture
- Lien PDF facture
- Date prochain prélèvement

---

#### `echec-paiement.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/echec-paiement`  
**Trigger** : Stripe webhook (invoice.payment_failed)  
**Statut** : ✅ Actif

**Actions** :
- Email alerte échec
- SMS alerte (si < 3 échecs)
- Déclenchement `suspendre-compte` (si 3 échecs)

---

#### `annuler-abonnement.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/annuler-abonnement`  
**Trigger** : Stripe webhook (customer.subscription.deleted) + Client manuel  
**Statut** : ✅ Actif

**Actions** :
- Email confirmation annulation
- Date fin accès
- Questionnaire satisfaction
- Bouton réactivation

---

#### `upgrade-downgrade-plan.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/changement-formule`  
**Trigger** : Stripe webhook (customer.subscription.updated)  
**Statut** : ✅ Actif

**Actions** :
- Email félicitations (upgrade) ou confirmation (downgrade)
- Nouvelles fonctionnalités
- Calcul prorata

---

#### `rappel-renouvellement.json` ✅
**Type** : Cron (quotidien 9h)  
**API** : `/api/internal/subscriptions/expiring-soon`  
**Statut** : ✅ Actif

**Actions** :
- Récupère abonnements J-7
- Email rappel pour chaque client
- Informe prélèvement à venir

---

#### `suspendre-compte.json` ✅
**Webhook** : `https://n8n.talosprimes.com/webhook/suspendre-compte`  
**Trigger** : Workflow `echec-paiement` (3 échecs) + Admin manuel  
**Statut** : ✅ Actif

**Actions** :
- Appel API `/api/internal/subscriptions/suspend`
- Email suspension détaillé
- SMS urgence
- Démarches réactivation

---

### 📊 4. MONITORING (1 workflow)

#### `logs-abonnements.json` ✅
**Type** : Monitoring  
**Statut** : ✅ Actif

**Actions** :
- Logs événements abonnements

---

## 🟡 WORKFLOWS PRÊTS À CONFIGURER (6)

### 📄 5. FACTURATION (6 workflows)

**Localisation** : `n8n-workflows/facturation/`  
**Statut Général** : 🟡 Développés, non importés dans N8N  
**Documentation** : `N8N_GUIDE_VISUEL.md`

---

#### `envoyer-devis.json` 🟡
**Webhook** : `https://n8n.talosprimes.com/webhook/envoyer-devis`  
**Connexion App** : `/facturation` (interface)  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Récupère document + items
- Génère PDF devis
- Envoie email professionnel
- Met à jour statut → "sent"
- Log dans `billing_platform_logs`

**Credentials requises** :
- Supabase Service Key
- Resend SMTP

---

#### `envoyer-facture.json` 🟡
**Webhook** : `https://n8n.talosprimes.com/webhook/envoyer-facture`  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Récupère facture + items
- Génère PDF facture
- Envoie email avec instructions paiement
- Met à jour statut → "sent"
- Log action

**Credentials requises** :
- Supabase Service Key
- Resend SMTP

---

#### `confirmation-paiement.json` 🟡
**Webhook** : `https://n8n.talosprimes.com/webhook/confirmation-paiement`  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Email remerciement
- Reçu de paiement
- Confirme montant payé

**Credentials requises** :
- Supabase Service Key
- Resend SMTP

---

#### `relance-devis-j3.json` 🟡
**Type** : Cron (quotidien 9h)  
**API** : `/api/n8n/billing/quotes/expiring`  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Récupère devis expirant dans 3 jours
- Envoie email rappel pour chaque devis
- Log relances

**Credentials requises** :
- Supabase Service Key
- Resend SMTP

**⚠️ IMPORTANT** : Doit être ACTIF (toggle vert) pour s'exécuter

---

#### `relance-factures-impayees.json` 🟡
**Type** : Cron (quotidien 10h)  
**API** : `/api/n8n/billing/invoices/reminders`  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Récupère factures impayées
- Détermine niveau de relance (0, 1, 2, 3)
- Envoie email selon niveau :
  - **Niveau 0** (J-7) : Rappel avant échéance
  - **Niveau 1** (J+3) : Rappel amical
  - **Niveau 2** (J+10) : 2ème relance
  - **Niveau 3** (J+20) : Dernière relance
- Log toutes relances

**Credentials requises** :
- Supabase Service Key
- Resend SMTP (4 nodes email)

**⚠️ IMPORTANT** : Doit être ACTIF (toggle vert) pour s'exécuter

---

#### `generer-pdf-document.json` 🟡
**Webhook** : `https://n8n.talosprimes.com/webhook/generer-pdf`  
**Statut** : 🟡 Prêt à importer

**Actions** :
- Récupère document + items + paramètres
- Génère HTML template professionnel
- Convertit HTML → PDF
- Sauvegarde dans Supabase Storage
- Retourne URL du PDF
- Met à jour `pdf_url` dans `billing_documents`

**Credentials requises** :
- Supabase Service Key

---

## 📋 CHECKLIST PAR CATÉGORIE

### ✅ Leads (100% Opérationnel)
- [x] 3 workflows importés
- [x] Credentials configurées
- [x] Workflows actifs
- [x] API routes connectées
- [x] Tests validés

### ✅ Essais (100% Opérationnel)
- [x] 1 workflow importé
- [x] Credentials configurées
- [x] Workflow actif
- [x] API route connectée
- [x] Tests validés

### ✅ Abonnements (100% Opérationnel)
- [x] 7 workflows importés
- [x] Credentials configurées
- [x] Workflows actifs
- [x] Webhooks Stripe connectés
- [x] Crons actifs (9h)
- [x] Tests validés

### 🟡 Facturation (Prêt, Non Configuré)
- [ ] 6 workflows à importer
- [ ] Credentials à configurer (Supabase + Resend)
- [ ] Workflows à activer
- [ ] Crons à activer (9h + 10h)
- [ ] Tests à effectuer

**Temps d'installation** : 20 minutes  
**Guide** : `docs/N8N_GUIDE_VISUEL.md`

---

## 🎯 PROCHAINES ÉTAPES

### Pour Activer Facturation (20 min)

1. **Connexion N8N**
   ```
   https://n8n.talosprimes.com
   ```

2. **Vérifier Credentials** (déjà faites normalement)
   - ✅ Supabase Service Key
   - ✅ Resend SMTP

3. **Importer Workflows** (6 fichiers)
   ```
   Menu : Workflows > Import from File
   
   Fichiers :
   - n8n-workflows/facturation/envoyer-devis.json
   - n8n-workflows/facturation/envoyer-facture.json
   - n8n-workflows/facturation/confirmation-paiement.json
   - n8n-workflows/facturation/relance-devis-j3.json
   - n8n-workflows/facturation/relance-factures-impayees.json
   - n8n-workflows/facturation/generer-pdf-document.json
   ```

4. **Configurer Credentials** (pour chaque workflow)
   ```
   Nodes à configurer :
   - "Récupérer Document" → Supabase Service Key
   - "Envoyer Email" → Resend SMTP
   - "Mettre à jour statut" → Supabase Service Key
   ```

5. **Activer Workflows** (IMPORTANT !)
   ```
   Pour chaque workflow :
   - Save (Ctrl+S)
   - Toggle "Inactive" → "Active" (VERT)
   ```

6. **Vérifier Crons**
   ```
   Relance Devis J-3 : 0 9 * * * (9h tous les jours)
   Relances Factures : 0 10 * * * (10h tous les jours)
   ```

7. **Tester**
   ```bash
   curl -X POST https://n8n.talosprimes.com/webhook/envoyer-devis \
     -H "Content-Type: application/json" \
     -d '{"document_id":"test","customer_email":"meddecyril@icloud.com","customer_name":"Test"}'
   ```

---

## 📊 STATISTIQUES GLOBALES

### Workflows par Type

| Type | Nombre | Statut |
|------|--------|--------|
| **Webhooks** | 12 | ✅ 6 actifs, 🟡 6 prêts |
| **Crons** | 3 | ✅ 1 actif, 🟡 2 prêts |
| **Monitoring** | 1 | ✅ Actif |
| **Management** | 2 | ✅ Actifs |

### Automatisations Actives

- ✅ **Emails** : 15+ templates (bienvenue, relances, confirmations)
- ✅ **SMS** : Notifications leads + admins
- ✅ **PDF** : Génération automatique (devis, factures)
- ✅ **Relances** : Multi-niveaux (devis + factures)
- ✅ **Logs** : Centralisés dans `/platform/logs`

### Credentials Configurées

- ✅ **Supabase** : Service Role Key
- ✅ **Resend** : SMTP + API Key
- ✅ **Twilio** : SMS (Account SID + Auth Token)
- ✅ **Stripe** : Webhooks (via API route)

---

## 📚 DOCUMENTATION

### Guides Disponibles

| Document | Description | Temps |
|----------|-------------|-------|
| **N8N_GUIDE_VISUEL.md** | Import workflows facturation | 20 min |
| **GUIDE_ACTIVATION_MODULE_FACTURATION.md** | Installation complète module | 30 min |
| **MODULE_FACTURATION_RESUME.md** | Vue d'ensemble | 5 min |
| **REPONSE_MODULE_FACTURATION.md** | FAQ module | 5 min |

### Fichiers Workflows

```
n8n-workflows/
├── leads/ (3 workflows) ✅
├── essais/ (1 workflow) ✅
├── abonnements/ (7 workflows) ✅
├── facturation/ (6 workflows) 🟡
├── monitoring/ (1 workflow) ✅
└── README.md
```

---

## 🎉 CONCLUSION

### État Actuel : Excellent ✅

- **12/18 workflows actifs** (67%)
- **6/18 workflows prêts** (33%)
- **0 workflows en développement** (100% terminé !)

### Couverture Fonctionnelle

| Domaine | Couverture |
|---------|-----------|
| **Leads** | ✅ 100% |
| **Essais** | ✅ 100% |
| **Abonnements** | ✅ 100% |
| **Facturation** | 🟡 Prêt à activer |
| **Monitoring** | ✅ 100% |

### Pour Atteindre 100%

Il ne manque que **20 minutes** pour activer les 6 workflows de facturation !

**Action** : Suivre `docs/N8N_GUIDE_VISUEL.md`

---

**Dernière mise à jour** : 2 Janvier 2026  
**Prochaine révision** : Après activation facturation  
**Mainteneur** : Équipe Talos Prime


