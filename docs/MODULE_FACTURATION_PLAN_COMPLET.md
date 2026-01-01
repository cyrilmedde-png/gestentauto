# 📊 MODULE FACTURATION COMPLET - Plan d'Implémentation

Date: 2026-01-01 20:15

---

## 🎯 OBJECTIF

Créer un **module de facturation professionnel** complet incluant:
- 📋 **Devis** (Quotes)
- 🧾 **Proforma**
- 💰 **Factures** (Invoices)
- ↩️ **Avoirs** (Credit Notes)
- 📥 **Factures d'Achat** (Purchase Invoices)

**Note**: Ce module prépare aussi le terrain pour un **module comptabilité complet** ultérieur.

---

## 📚 DOCUMENTS GÉRÉS

### 1. 📋 DEVIS (Quote)
**Usage**: Proposition commerciale au client
- ✅ Valable X jours (défaut: 30 jours)
- ✅ Statuts: brouillon, envoyé, accepté, refusé
- ✅ Convertible en facture en 1 clic
- ✅ Email automatique au client
- ✅ Relances automatiques si pas de réponse

**Numérotation**: `DEV-2026-0001`

### 2. 🧾 PROFORMA
**Usage**: Facture avant paiement (douanes, banques)
- ✅ Similaire à facture mais non comptabilisée
- ✅ Pour clients internationaux
- ✅ Convertible en facture après paiement

**Numérotation**: `PRO-2026-0001`

### 3. 💰 FACTURE (Invoice)
**Usage**: Document fiscal principal
- ✅ Numérotation légale obligatoire
- ✅ Comptabilisée automatiquement
- ✅ Date d'échéance
- ✅ Statuts: brouillon, envoyée, payée, impayée, en retard
- ✅ Gestion paiements partiels
- ✅ Relances automatiques

**Numérotation**: `FAC-2026-0001`

### 4. ↩️ AVOIR (Credit Note)
**Usage**: Annulation/remboursement
- ✅ Lié à une facture parent
- ✅ Comptabilisé négativement
- ✅ Réduit le montant dû
- ✅ Numérotation indépendante

**Numérotation**: `AVO-2026-0001`

### 5. 📥 FACTURE D'ACHAT (Purchase Invoice)
**Usage**: Fournisseurs/dépenses
- ✅ Gestion des dépenses
- ✅ Lié à un fournisseur
- ✅ Comptabilité créditeurs
- ✅ Suivi des paiements

**Numérotation**: `ACH-2026-0001`

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Tables Créées

```
✅ billing_documents          (documents principaux)
✅ billing_document_items      (lignes de détail)
✅ billing_sequences           (numérotation automatique)
✅ billing_payments            (historique paiements)
✅ billing_settings            (paramètres par entreprise)
```

### Fonctions SQL

```sql
✅ get_next_document_number()    -- Génère DEV-2026-0001
✅ recalculate_document_totals() -- Auto-calcul montants
✅ calculate_paid_amount()       -- Total payé
```

### Triggers Automatiques

```
✅ Auto-recalcul totaux après ajout/modif item
✅ Auto-update statut (paid/partially_paid) après paiement
✅ Auto-update paid_at quand paiement complet
```

---

## 🔐 SÉCURITÉ (RLS)

- ✅ **Multi-tenant**: Chaque entreprise voit uniquement ses documents
- ✅ **RLS activé** sur toutes les tables
- ✅ **Policies**: Utilisateurs accèdent via `company_id`

---

## 📊 STATUTS DOCUMENTS

### Devis
- `draft` - Brouillon
- `sent` - Envoyé
- `accepted` - Accepté
- `rejected` - Refusé
- `expired` - Expiré
- `converted` - Converti en facture

### Factures
- `draft` - Brouillon
- `sent` - Envoyée
- `paid` - Payée
- `partially_paid` - Partiellement payée
- `overdue` - En retard
- `cancelled` - Annulée

### Avoirs
- `draft` - Brouillon
- `sent` - Envoyé
- `applied` - Appliqué

---

## 🔢 SYSTÈME DE NUMÉROTATION

### Format: `[PREFIX]-[YEAR]-[NUMBER]`

**Exemples**:
- Devis: `DEV-2026-0001`, `DEV-2026-0002`...
- Facture: `FAC-2026-0001`, `FAC-2026-0002`...
- Avoir: `AVO-2026-0001`...
- Proforma: `PRO-2026-0001`...
- Achat: `ACH-2026-0001`...

### Caractéristiques:
- ✅ **Incrémentation automatique** par type et par année
- ✅ **Préfixes personnalisables** par entreprise
- ✅ **Unique** (contrainte DB)
- ✅ **Légal** (séquence chronologique)

---

## 💰 GESTION FINANCIÈRE

### Calculs Automatiques

```javascript
subtotal = Σ(quantity × unit_price)
tax_amount = subtotal × (tax_rate / 100)
total = subtotal + tax_amount - discount_amount
```

### TVA par Ligne
- ✅ Chaque ligne peut avoir son propre taux de TVA
- ✅ TVA 0%, 5.5%, 10%, 20% (France)
- ✅ Total TVA = Σ(tax_amount par ligne)

### Paiements Partiels
- ✅ Historique complet des paiements
- ✅ Auto-update statut: `partially_paid` → `paid`
- ✅ Solde restant: `total_amount - paid_amount`

---

## 🎨 FONCTIONNALITÉS AVANCÉES

### 1. **Conversion Automatique**
```
Devis → Facture (1 clic)
Proforma → Facture (après paiement)
Facture → Avoir (remboursement)
```

### 2. **Relances Automatiques**
```
J+7 : Premier rappel (email)
J+15 : Second rappel (email + SMS)
J+30 : Dernier rappel (notification admin)
J+45 : Statut "overdue" + alerte
```

### 3. **Génération PDF**
- ✅ Template professionnel
- ✅ Logo entreprise
- ✅ Couleurs personnalisables
- ✅ Mentions légales
- ✅ QR Code paiement (optionnel)

### 4. **Email Automatique**
```
Devis envoyé → Email au client
Facture envoyée → Email + PDF
Paiement reçu → Email de confirmation
Avoir créé → Email de notification
```

### 5. **Dashboard Analytics**
```
📊 Chiffre d'affaires (mois/année)
📈 Devis en attente
💰 Factures impayées
⏰ Retards de paiement
📉 Taux de conversion devis → facture
```

---

## 📂 ARCHITECTURE FICHIERS À CRÉER

### Backend (API Routes)
```
app/api/billing/
  ├── documents/
  │   ├── list/route.ts          (GET - Liste documents)
  │   ├── create/route.ts        (POST - Créer document)
  │   ├── [id]/route.ts          (GET/PUT/DELETE - CRUD)
  │   ├── [id]/send/route.ts     (POST - Envoyer email)
  │   ├── [id]/convert/route.ts  (POST - Convertir)
  │   └── [id]/pdf/route.ts      (GET - Générer PDF)
  ├── items/
  │   ├── create/route.ts        (POST - Ajouter ligne)
  │   ├── [id]/route.ts          (PUT/DELETE - Modifier ligne)
  ├── payments/
  │   ├── create/route.ts        (POST - Enregistrer paiement)
  │   └── list/route.ts          (GET - Historique)
  ├── settings/
  │   ├── route.ts               (GET/PUT - Paramètres)
  └── stats/
      └── route.ts               (GET - Analytics)
```

### N8N Workflows
```
n8n-workflows/facturation/
  ├── envoyer-devis.json         (Email devis au client)
  ├── envoyer-facture.json       (Email facture + PDF)
  ├── relance-devis.json         (Rappel devis expirant)
  ├── relance-facture.json       (Rappel facture impayée)
  ├── confirmation-paiement.json (Email paiement reçu)
  ├── generer-pdf.json           (Génération PDF document)
  └── notification-avoir.json    (Email avoir créé)
```

### Frontend (Pages)
```
app/billing/
  ├── page.tsx                   (Dashboard facturation)
  ├── quotes/
  │   ├── page.tsx               (Liste devis)
  │   └── [id]/page.tsx          (Détail/édition devis)
  ├── invoices/
  │   ├── page.tsx               (Liste factures)
  │   └── [id]/page.tsx          (Détail/édition facture)
  ├── credit-notes/
  │   ├── page.tsx               (Liste avoirs)
  │   └── [id]/page.tsx          (Détail/édition avoir)
  ├── proforma/
  │   ├── page.tsx               (Liste proforma)
  │   └── [id]/page.tsx          (Détail/édition proforma)
  ├── purchases/
  │   ├── page.tsx               (Liste factures achat)
  │   └── [id]/page.tsx          (Détail/édition achat)
  └── settings/
      └── page.tsx               (Paramètres facturation)
```

### Components
```
components/billing/
  ├── DocumentList.tsx           (Tableau liste documents)
  ├── DocumentForm.tsx           (Form création/édition)
  ├── DocumentViewer.tsx         (Aperçu PDF)
  ├── ItemsManager.tsx           (Gestion lignes)
  ├── PaymentHistory.tsx         (Historique paiements)
  ├── StatsCard.tsx              (Carte statistique)
  └── StatusBadge.tsx            (Badge statut coloré)
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### PHASE 1: Base (Semaine 1) ✅
- [x] Migration SQL (tables + functions + triggers)
- [ ] API Routes CRUD basiques
- [ ] Frontend liste + formulaire simple

### PHASE 2: Workflows (Semaine 2)
- [ ] N8N: Envoi emails
- [ ] N8N: Génération PDF
- [ ] N8N: Relances automatiques

### PHASE 3: Avancé (Semaine 3)
- [ ] Conversions (devis → facture)
- [ ] Paiements partiels
- [ ] Dashboard analytics

### PHASE 4: Finalisation (Semaine 4)
- [ ] Design professionnel
- [ ] Export Excel/CSV
- [ ] Tests complets
- [ ] Documentation

---

## 🔮 PRÉPARATION MODULE COMPTABILITÉ

Ce module facturation prépare le terrain pour un **module comptabilité complet**:

### Déjà Implémenté
- ✅ Gestion créanciers (factures clients)
- ✅ Gestion débiteurs (factures fournisseurs)
- ✅ Historique paiements
- ✅ TVA par document

### À Ajouter pour Comptabilité
- [ ] **Plan comptable** (comptes 401, 411, 512, etc.)
- [ ] **Écritures comptables** automatiques
- [ ] **Grand livre** / **Livre journal**
- [ ] **Balance comptable**
- [ ] **Rapprochement bancaire**
- [ ] **Déclaration TVA** (CA3)
- [ ] **Bilan** / **Compte de résultat**
- [ ] **Export FEC** (Fichier Écritures Comptables)

---

## 📊 KPIs & METRICS

### Analytics Temps Réel
```
📈 CA du mois: 45 320€
📋 15 devis en attente
💰 8 factures impayées (12 450€)
⏰ 3 retards de paiement
✅ Taux conversion: 68%
📊 Délai moyen paiement: 22 jours
```

---

## ✅ CHECKLIST DÉMARRAGE

### Étape 1: Migration SQL
- [ ] Exécuter `database/create_billing_module.sql` dans Supabase
- [ ] Vérifier tables créées
- [ ] Vérifier functions & triggers

### Étape 2: API Routes (TODO)
- [ ] Créer toutes les routes listées ci-dessus
- [ ] Tester avec Postman/curl

### Étape 3: Frontend (TODO)
- [ ] Créer pages principales
- [ ] Intégrer avec API
- [ ] Design moderne

### Étape 4: N8N (TODO)
- [ ] Créer workflows
- [ ] Intégrer avec API
- [ ] Tester emails

### Étape 5: Tests & Docs (TODO)
- [ ] Tests end-to-end
- [ ] Documentation utilisateur
- [ ] Guide admin

---

## 🎯 VALEUR AJOUTÉE

### Pour l'Utilisateur
- ✅ **Gain de temps**: Automatisation complète
- ✅ **Professionnalisme**: Documents impeccables
- ✅ **Conformité**: Numérotation légale
- ✅ **Suivi**: Tableau de bord en temps réel
- ✅ **Relances**: Automatiques, plus d'oublis

### Pour l'Entreprise
- ✅ **Productivité**: -70% temps admin
- ✅ **Cash flow**: Paiements plus rapides
- ✅ **Traçabilité**: Historique complet
- ✅ **Analytics**: Décisions data-driven
- ✅ **Évolutivité**: Prêt pour comptabilité

---

## 📞 PROCHAINES ÉTAPES

### Immédiat
1. ✅ Valider le schéma SQL
2. ⏳ Créer API Routes CRUD
3. ⏳ Créer interface liste documents
4. ⏳ Créer formulaire création

### Court Terme (Cette Semaine)
- API complète
- Frontend basique fonctionnel
- Premier workflow N8N (envoi devis)

### Moyen Terme (Ce Mois)
- Tous les workflows N8N
- Dashboard analytics
- Tests complets

---

## 🎉 VISION FINALE

Un **module de facturation professionnel** qui:
- 🚀 Fait gagner **des heures par semaine**
- 💰 Améliore le **cash flow** (relances auto)
- 📊 Donne une **visibilité complète** sur les finances
- 🔒 Est **100% conforme** légalement
- 🔮 Prépare la **comptabilité intégrée**

---

**PRÊT À DÉMARRER LA PHASE 2 ! 💪**

*La migration SQL est déjà prête dans:*
`database/create_billing_module.sql`

