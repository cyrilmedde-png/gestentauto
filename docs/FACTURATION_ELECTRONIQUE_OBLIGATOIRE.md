# 📧 FACTURATION ÉLECTRONIQUE OBLIGATOIRE - Guide Complet

Date: 2026-01-01
Référence: Loi de finances 2024, Article 91

---

## 🎯 CONTEXTE LÉGAL

### Réforme Facturation Électronique

La **facturation électronique devient obligatoire** en France pour toutes les transactions entre entreprises assujetties à la TVA (B2B).

### 📅 CALENDRIER OBLIGATOIRE

| Date | Obligation |
|------|------------|
| **1er septembre 2026** | • Toutes entreprises: **RÉCEPTION** factures électroniques<br>• Grandes entreprises & ETI: **ÉMISSION** factures électroniques |
| **1er septembre 2027** | • PME & micro-entreprises: **ÉMISSION** factures électroniques |

---

## 📋 NOUVELLES MENTIONS OBLIGATOIRES

### Depuis le 1er septembre 2026

Toutes les factures B2B doivent inclure:

| Mention | Description | Format | Exemple |
|---------|-------------|--------|---------|
| **SIREN client** ✅ | Numéro SIREN du client | 9 chiffres | `123456789` |
| **Catégorie opération** ✅ | Type de transaction | `goods` / `services` / `both` | `both` |
| **Option TVA sur débits** | Si applicable | `true` / `false` | `false` |
| **Adresse de livraison** | Si différente de facturation | Texte complet | `123 Rue...` |

### Mentions Existantes (toujours obligatoires)

- ✅ Numéro de facture (chronologique)
- ✅ Date d'émission
- ✅ SIREN/SIRET émetteur
- ✅ Numéro TVA intracommunautaire
- ✅ Nom et adresse du client
- ✅ Détail des produits/services
- ✅ Montant HT, TVA, TTC
- ✅ Date d'échéance (si applicable)

---

## 🔧 FORMATS ÉLECTRONIQUES ACCEPTÉS

### 1. **Factur-X** (Recommandé) ⭐

**Description**: PDF/A-3 + fichier XML embarqué

**Avantages**:
- ✅ Lisible par humain (PDF)
- ✅ Traitable par machine (XML)
- ✅ Archivage long terme (PDF/A-3)
- ✅ Norme franco-allemande reconnue
- ✅ Compatible avec la plupart des logiciels

**Structure**:
```
Factur-X.pdf
├── Partie visuelle (PDF/A-3)
└── Données structurées (XML CII)
```

**Niveaux Factur-X**:
- **MINIMUM**: Données minimales
- **BASIC WL**: Sans lignes de détail
- **BASIC**: Avec lignes de détail
- **EN 16931**: Standard européen (recommandé)
- **EXTENDED**: Données étendues

### 2. **UBL** (Universal Business Language)

**Description**: Format XML pur

**Avantages**:
- ✅ Standard international (ISO/IEC 19845)
- ✅ Très structuré
- ✅ Supporté par Chorus Pro

**Inconvénients**:
- ❌ Pas de rendu visuel
- ❌ Nécessite un viewer

### 3. **CII** (Cross Industry Invoice)

**Description**: Format XML UN/CEFACT

**Avantages**:
- ✅ Standard ONU
- ✅ Très flexible
- ✅ Base du Factur-X

**Inconvénients**:
- ❌ Pas de rendu visuel

---

## 🏢 PLATEFORMES DE DÉMATÉRIALISATION

### Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?

Les **PDP** sont des plateformes agréées par l'État pour:
- 📤 Émettre des factures électroniques
- 📥 Recevoir des factures électroniques
- 🔄 Convertir les formats (interopérabilité)
- 🔒 Garantir l'intégrité et l'authenticité
- 📊 Transmettre les données à la DGFIP (e-reporting)

### Principales Plateformes Agréées

| Plateforme | Type | URL |
|------------|------|-----|
| **Chorus Pro** | Publique (gratuite) | chorus-pro.gouv.fr |
| **Docaposte** | Privée | docaposte.com |
| **Generix** | Privée | generixgroup.com |
| **Pagero** | Privée | pagero.com |
| **Basware** | Privée | basware.com |
| **Sage** | Privée | sage.com |

### Choix de la Plateforme

**Critères**:
- ✅ Coût (gratuit vs payant)
- ✅ API disponible
- ✅ Formats supportés
- ✅ Volume de factures
- ✅ Support client
- ✅ Intégration avec logiciel existant

---

## 📊 E-REPORTING (Transmission Données Fiscales)

### Qu'est-ce que l'e-reporting ?

**Obligation** de transmettre à l'administration fiscale les données de transactions **non couvertes** par la facturation électronique:

- 🛒 **Ventes B2C** (particuliers)
- 🌍 **Ventes à l'export**
- 🇪🇺 **Ventes B2B intracommunautaires**
- 🌐 **Ventes à entreprises étrangères**

### Données à Transmettre

- Date de transaction
- Montant HT
- Montant TVA
- Type de transaction
- Moyen de paiement
- Date de paiement

### Fréquence

- 📅 **Mensuelle** ou **trimestrielle** selon régime TVA

---

## 🛠️ INTÉGRATION TECHNIQUE

### 1. **Base de Données**

#### Nouvelles Colonnes `billing_documents`

```sql
customer_siren VARCHAR(9)              -- SIREN client ✅
operation_category VARCHAR(50)         -- goods/services/both ✅
vat_on_debit BOOLEAN                   -- Option TVA sur débits
delivery_address TEXT                  -- Adresse livraison

electronic_format VARCHAR(50)          -- factur-x/ubl/cii
electronic_status VARCHAR(50)          -- pending/sent/validated/rejected
platform_name VARCHAR(100)             -- Nom PDP
platform_id VARCHAR(255)               -- ID sur PDP
xml_file_url TEXT                      -- URL fichier XML
facturx_file_url TEXT                  -- URL fichier Factur-X
transmission_date TIMESTAMP            -- Date envoi PDP
validation_date TIMESTAMP              -- Date validation PDP
rejection_reason TEXT                  -- Raison rejet
```

#### Nouvelle Table `billing_ereporting`

```sql
CREATE TABLE billing_ereporting (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES billing_documents(id),
  transaction_type VARCHAR(50),        -- b2c/b2b_foreign/export
  transaction_date DATE,
  amount DECIMAL(10, 2),
  vat_amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date DATE,
  reported_to_dgfip BOOLEAN,           -- Transmis DGFIP
  report_date TIMESTAMP,
  report_reference VARCHAR(255)
);
```

#### Nouvelle Table `billing_platform_logs`

```sql
CREATE TABLE billing_platform_logs (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES billing_documents(id),
  action VARCHAR(50),                   -- send/receive/validate/reject
  platform_name VARCHAR(100),
  platform_response TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP
);
```

### 2. **Paramètres Plateforme** (`billing_settings`)

```sql
edp_platform VARCHAR(100)              -- Chorus Pro / Docaposte...
edp_api_key TEXT                       -- Clé API
edp_api_url TEXT                       -- URL API
edp_company_id VARCHAR(255)            -- ID entreprise sur PDP
edp_enabled BOOLEAN                    -- Facturation électronique activée
edp_default_format VARCHAR(50)         -- factur-x (par défaut)
ereporting_enabled BOOLEAN             -- E-reporting activé
```

### 3. **Fonctions SQL Utiles**

#### Valider SIREN
```sql
SELECT validate_siren('123456789');
-- Retourne: true/false
```

#### Vérifier Conformité
```sql
SELECT * FROM check_electronic_invoice_compliance('uuid-facture');
-- Retourne: {is_compliant: false, missing_fields: ['SIREN client', 'Catégorie opération']}
```

#### Générer Nom Factur-X
```sql
SELECT generate_facturx_filename('uuid-facture');
-- Retourne: 'FACTURX_123456789_FAC-2026-0001_20260115.pdf'
```

### 4. **Vue: Factures Non Conformes**

```sql
SELECT * FROM billing_non_compliant_invoices;
-- Liste toutes les factures ne respectant pas les obligations
```

---

## 🔄 WORKFLOW FACTURATION ÉLECTRONIQUE

### Émission Facture

```mermaid
1. Création facture dans application
   ↓
2. Validation mentions obligatoires (SIREN, catégorie...)
   ↓
3. Génération fichier Factur-X (PDF/A-3 + XML)
   ↓
4. Transmission à la PDP (API)
   ↓
5. PDP valide le format
   ↓
6. PDP transmet au client
   ↓
7. Client reçoit via sa PDP
   ↓
8. PDP transmet données à DGFIP (e-reporting)
```

### Réception Facture

```mermaid
1. Fournisseur émet via sa PDP
   ↓
2. PDP du fournisseur transmet à notre PDP
   ↓
3. Notre PDP notifie notre application (webhook)
   ↓
4. Application télécharge Factur-X
   ↓
5. Extraction données XML
   ↓
6. Création document dans billing_documents
   ↓
7. Notification utilisateur
```

---

## 🚀 API ROUTES À CRÉER

### Émission

```typescript
POST /api/billing/electronic/send
Body: {
  document_id: "uuid",
  format: "factur-x" | "ubl" | "cii",
  platform: "chorus-pro" | "docaposte"
}
```

### Vérification Conformité

```typescript
GET /api/billing/electronic/check-compliance/:documentId
Response: {
  isCompliant: boolean,
  missingFields: string[],
  warnings: string[]
}
```

### Génération Factur-X

```typescript
POST /api/billing/electronic/generate-facturx
Body: {
  document_id: "uuid",
  level: "minimum" | "basic" | "en16931" | "extended"
}
Response: {
  pdf_url: string,
  xml_url: string,
  facturx_url: string
}
```

### Logs Transmission

```typescript
GET /api/billing/electronic/logs/:documentId
Response: [{
  action: "send" | "receive" | "validate" | "reject",
  platform: string,
  success: boolean,
  error_message: string,
  created_at: string
}]
```

---

## 📦 LIBRAIRIES RECOMMANDÉES

### Génération Factur-X (Node.js)

```bash
npm install factur-x
npm install pdfkit
npm install libxmljs
```

### Validation XML

```bash
npm install ajv
npm install fast-xml-parser
```

### Communication PDP

```bash
npm install axios
npm install form-data
```

---

## 🧪 EXEMPLE CODE

### Vérifier Conformité

```typescript
const checkCompliance = async (documentId: string) => {
  const { data } = await supabase
    .rpc('check_electronic_invoice_compliance', { p_document_id: documentId })
  
  if (!data.is_compliant) {
    throw new Error(`Facture non conforme: ${data.missing_fields.join(', ')}`)
  }
  
  return true
}
```

### Envoyer à Chorus Pro

```typescript
const sendToChorusPro = async (documentId: string) => {
  // 1. Récupérer document
  const doc = await getDocument(documentId)
  
  // 2. Vérifier conformité
  await checkCompliance(documentId)
  
  // 3. Générer Factur-X
  const facturx = await generateFacturX(doc)
  
  // 4. Envoyer à Chorus Pro
  const response = await axios.post('https://chorus-pro.gouv.fr/api/v1/invoice', {
    file: facturx,
    recipient_siret: doc.customer_siren
  }, {
    headers: {
      'Authorization': `Bearer ${CHORUS_PRO_API_KEY}`,
      'Content-Type': 'multipart/form-data'
    }
  })
  
  // 5. Logger transmission
  await supabase.from('billing_platform_logs').insert({
    document_id: documentId,
    action: 'send',
    platform_name: 'Chorus Pro',
    platform_response: JSON.stringify(response.data),
    success: response.status === 200
  })
  
  // 6. Mettre à jour document
  await supabase.from('billing_documents').update({
    electronic_status: 'sent',
    platform_name: 'Chorus Pro',
    platform_id: response.data.invoice_id,
    transmission_date: new Date().toISOString()
  }).eq('id', documentId)
}
```

---

## ⚠️ PÉNALITÉS NON-CONFORMITÉ

### Sanctions

- ❌ **15€ par facture non conforme** (plafonné à 15 000€/an)
- ❌ **Redressement fiscal** possible
- ❌ **Perte de crédibilité** auprès des clients

### Points de Vigilance

- ⚠️ **SIREN obligatoire** : Sans SIREN client, facture invalide
- ⚠️ **Format obligatoire** : PDF simple non accepté (doit être Factur-X/UBL/CII)
- ⚠️ **Transmission PDP** : Envoi email direct non accepté
- ⚠️ **E-reporting** : Oubli = sanction

---

## ✅ CHECKLIST CONFORMITÉ

### Phase Préparation

- [ ] Choisir une PDP (Chorus Pro recommandé)
- [ ] Créer compte sur la PDP
- [ ] Récupérer clés API
- [ ] Tester connexion API

### Phase Développement

- [ ] Exécuter `add_electronic_invoicing.sql`
- [ ] Créer API routes (send, check, generate)
- [ ] Intégrer librairie Factur-X
- [ ] Développer interface paramètres PDP
- [ ] Créer formulaire mentions obligatoires
- [ ] Développer logs transmission

### Phase Tests

- [ ] Tester génération Factur-X
- [ ] Tester envoi PDP (environnement test)
- [ ] Tester réception PDP
- [ ] Vérifier validation XML
- [ ] Tester e-reporting

### Phase Production

- [ ] Former les utilisateurs
- [ ] Documenter procédures
- [ ] Activer facturation électronique
- [ ] Surveiller logs erreurs
- [ ] Suivre taux de conformité

---

## 📚 RESSOURCES OFFICIELLES

### Liens Utiles

- 🏛️ [Portail Facturation Électronique](https://www.impots.gouv.fr/facturation-electronique)
- 📄 [FAQ DGFIP](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq_fe_05_01_2024_vf.pdf)
- 🇫🇷 [Guide Ministère Économie](https://www.economie.gouv.fr/cedef/facturation-electronique-entreprises)
- 🔧 [Norme Factur-X](https://fnfe-mpe.org/factur-x/)
- 🌍 [Standard UBL](https://www.oasis-open.org/committees/ubl/)

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Migration SQL** (déjà faite)
2. ⏳ **API Routes** (à créer)
3. ⏳ **Génération Factur-X** (à développer)
4. ⏳ **Intégration PDP** (à configurer)
5. ⏳ **Interface utilisateur** (à créer)
6. ⏳ **Tests conformité** (à effectuer)

---

**VOTRE MODULE EST MAINTENANT PRÊT POUR LA FACTURATION ÉLECTRONIQUE ! 🎉**

*Référence SQL:* `database/add_electronic_invoicing.sql`

