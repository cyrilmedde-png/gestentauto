# 🔄 Workflows N8N - Talos Prime

## 📋 Vue d'Ensemble

Ce dossier contient tous les workflows N8N utilisés par la plateforme Talos Prime pour l'automatisation des processus métier.

---

## 📁 Structure

```
n8n-workflows/
│
├── leads/                              # 📊 Gestion des leads
│   ├── inscription-lead.json          # ✅ Production
│   ├── creation-lead-complet.json     # ✅ Production
│   ├── leads-management.json          # ✅ Production
│   └── README.md
│
├── essais/                             # 🧪 Essais gratuits
│   ├── creer-essai.json               # ✅ Production
│   └── README.md
│
├── abonnements/                        # 💳 Abonnements Stripe
│   └── README.md                      # 🔮 À développer
│
├── notifications/                      # 🔔 Notifications
│   └── README.md                      # 🔮 À développer
│
├── maintenance/                        # 🔧 Maintenance & Monitoring
│   └── README.md                      # 🔮 À développer
│
├── _dev/                               # 🛠️ Développement
│   ├── register-module-example.json   # 🧪 Exemple
│   └── README.md
│
└── README.md                           # 📖 Ce fichier
```

---

## 🎯 Convention de Nommage

### Fichiers de Production
- **Format** : `action-objet.json`
- **Langue** : Français
- **Exemples** :
  - ✅ `creer-essai.json`
  - ✅ `inscription-lead.json`
  - ✅ `annuler-abonnement.json`

### Fichiers de Développement
- **Préfixe** : `_dev/`
- **Suffixe** : `-example` ou `-test`
- **Exemples** :
  - 🧪 `_dev/register-module-example.json`
  - 🧪 `_dev/test-email.json`

---

## 📊 Statuts des Workflows

| Emoji | Statut | Description |
|-------|--------|-------------|
| ✅ | Production | Actif et utilisé en production |
| 🔮 | Planifié | À développer prochainement |
| 🧪 | Développement | En cours de développement |
| 🛠️ | Exemple | Workflow exemple/template |
| ⚠️ | Maintenance | Nécessite une mise à jour |
| ❌ | Obsolète | Ne plus utiliser |

---

## 🚀 Workflows en Production

### Leads (3 workflows)
- ✅ `inscription-lead.json` - Pré-inscription clients
- ✅ `creation-lead-complet.json` - Création manuelle lead
- ✅ `leads-management.json` - Gestion leads

### Essais (1 workflow)
- ✅ `creer-essai.json` - Activation essai gratuit

**Total actif** : **4 workflows**

---

## 🔮 Workflows à Développer (Priorités)

### 🥇 Priorité Haute - Abonnements
1. `creer-abonnement.json`
2. `renouveler-abonnement.json`
3. `echec-paiement.json`
4. `annuler-abonnement.json`

### 🥈 Priorité Moyenne - Notifications
1. `notification-fin-essai-proche.json`
2. `notification-bienvenue-client.json`
3. `notification-onboarding.json`

### 🥉 Priorité Basse - Maintenance
1. `backup-database.json`
2. `monitoring-disponibilite.json`
3. `rapport-quotidien.json`

---

## 📥 Import dans N8N

### Étapes d'Import

1. **Connexion N8N**
   - Aller sur https://n8n.talosprimes.com
   - Se connecter avec vos identifiants admin

2. **Import du Workflow**
   - Cliquer sur "+" → "Import from File"
   - Sélectionner le fichier `.json`
   - Cliquer "Import"

3. **Configuration**
   - Configurer les credentials (Resend, Twilio, Supabase, etc.)
   - Vérifier les URLs des webhooks
   - Tester chaque nœud

4. **Activation**
   - Cliquer sur le **bouton vert** "Active" en haut à droite
   - Vérifier que le workflow est bien actif

5. **Test**
   - Déclencher le webhook manuellement
   - Vérifier les logs d'exécution
   - Tester avec des données réelles

---

## ⚙️ Configuration Globale

### Credentials Requises

#### Resend (Emails)
- **API Key** : `re_...`
- **Configuration** : N8N → Credentials → Resend API

#### Twilio (SMS)
- **Account SID** : `AC...`
- **Auth Token** : `...`
- **Phone Number** : `+33XXXXXXXXX`
- **Configuration** : N8N → Credentials → Twilio API

#### Supabase
- **URL** : `https://XXXX.supabase.co`
- **Service Role Key** : `eyJ...`
- **Configuration** : N8N → Credentials → Supabase

#### Stripe (Abonnements)
- **Secret Key** : `sk_live_...` (production) / `sk_test_...` (test)
- **Webhook Secret** : `whsec_...`
- **Configuration** : N8N → Credentials → Stripe API

---

## 🔄 Workflow de Développement

### 1. Développement dans `_dev/`
```bash
# Créer un nouveau workflow de test
cp _dev/register-module-example.json _dev/mon-workflow-test.json
```

### 2. Test Local
- Importer dans N8N
- Configurer avec credentials de **test**
- Tester avec données factices
- Vérifier logs et erreurs

### 3. Validation
- ✅ Fonctionne avec données réelles (en test)
- ✅ Gestion d'erreurs OK
- ✅ Logs clairs
- ✅ Documentation à jour

### 4. Passage en Production
```bash
# Copier vers le dossier approprié
cp _dev/mon-workflow-test.json abonnements/mon-workflow.json

# Renommer (retirer -test ou -example)
# Mettre à jour le README du dossier
```

### 5. Déploiement
- Importer dans N8N production
- Configurer credentials **production**
- Activer le workflow
- Surveiller les premières exécutions

---

## 🧪 Tests des Workflows

### Test Manuel (cURL)

```bash
# Template de test
curl -X POST https://n8n.talosprimes.com/webhook/NOM_DU_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "data": {...}
  }'
```

### Test avec Logs Détaillés

```bash
# Avec verbose pour debug
curl -v -X POST https://n8n.talosprimes.com/webhook/NOM_DU_WEBHOOK \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### Vérification Logs N8N

1. Ouvrir le workflow dans N8N
2. Onglet "Executions" en bas
3. Cliquer sur l'exécution récente
4. Vérifier chaque nœud :
   - ✅ Vert = succès
   - ❌ Rouge = erreur
   - 🟡 Jaune = warning

---

## 📊 Monitoring

### Métriques Importantes

**Performance**
- ⚡ Temps d'exécution moyen
- ❌ Taux d'erreur
- 📈 Nombre d'exécutions/jour

**Business**
- 📧 Emails envoyés
- 📱 SMS envoyés
- 💰 Coûts mensuels

### Alertes à Configurer

- 🔴 Taux d'erreur > 5%
- 🔴 Temps exécution > 30s
- 🟡 Échec email/SMS > 3 fois

---

## 💰 Coûts Estimés

| Service | Coût | Usage Mensuel Estimé |
|---------|------|---------------------|
| **Resend** | $0.001/email | ~500 emails = $0.50 |
| **Twilio SMS** | ~$0.08/SMS | ~100 SMS = $8.00 |
| **N8N** | Self-hosted | $0 (VPS inclus) |
| **Total** | | **~$10/mois** |

---

## 🔒 Sécurité

### Bonnes Pratiques

✅ **À FAIRE**
- Utiliser HTTPS pour tous les webhooks
- Stocker credentials dans N8N (chiffrées)
- Valider toutes les données entrantes
- Logger les erreurs (pas les données sensibles)

❌ **À NE PAS FAIRE**
- Exposer des webhooks sans validation
- Logger les mots de passe ou tokens
- Utiliser credentials en dur dans les workflows
- Partager credentials entre test et production

---

## 📚 Documentation Associée

### Guides Principaux
- `/docs/WORKFLOW_ONBOARDING_COMPLET.md`
- `/DEPLOIEMENT_ONBOARDING.md`
- `/docs/GUIDE_WORKFLOW_LEAD_N8N.md`

### API Routes Liées
- `/app/api/auth/register-lead/route.ts`
- `/app/api/platform/trials/create/route.ts`
- `/app/api/email/send/route.ts`
- `/app/api/sms/send/route.ts`

### Documentation Externe
- [N8N Documentation](https://docs.n8n.io/)
- [Resend Documentation](https://resend.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

## 🛠️ Maintenance

### Responsables
- **Workflows Production** : Admin plateforme
- **Workflows Dev** : Développeurs
- **Monitoring** : Admin système

### Mises à Jour
- **Quotidien** : Vérification logs & erreurs
- **Hebdomadaire** : Review performances
- **Mensuel** : Optimisation & nettoyage

### Backup
- Tous les workflows sont versionnés dans Git
- Backup automatique N8N quotidien
- Export manuel recommandé après modifications importantes

---

## 🆘 Support

### En cas de Problème

1. **Vérifier les logs N8N**
   - Onglet Executions
   - Chercher l'erreur exacte

2. **Vérifier les credentials**
   - N8N → Settings → Credentials
   - Tester la connexion

3. **Vérifier les logs VPS**
   ```bash
   ssh root@votre-serveur.com
   pm2 logs talosprime
   pm2 logs n8n
   ```

4. **Contacter le support**
   - Email : dev@talosprimes.com
   - Fournir : logs + webhook + données test

---

## 📈 Roadmap

### Q1 2026
- ✅ Workflows leads (terminé)
- ✅ Workflows essais (terminé)
- 🔮 Workflows abonnements (en cours)

### Q2 2026
- 🔮 Workflows notifications avancées
- 🔮 Workflows maintenance automatisée
- 🔮 Dashboard monitoring N8N

### Q3 2026
- 🔮 Intégration IA (OpenAI)
- 🔮 Workflows analytics avancés
- 🔮 API publique pour workflows

---

## 📝 Changelog

### Version 1.0.0 (30/12/2025)
- ✅ Réorganisation complète structure
- ✅ 4 workflows production actifs
- ✅ Documentation complète par dossier
- ✅ Conventions de nommage définies

---

**Dernière mise à jour** : 30 décembre 2025  
**Version** : 1.0.0  
**Maintenu par** : Équipe Talos Prime

