# 🔧 Workflows - Maintenance & Tâches Automatiques

## Description
Workflows pour les tâches de maintenance automatiques, le monitoring, les backups et le nettoyage de données.

---

## 📁 Workflows (À créer)

### 🔮 backup-database.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 3h du matin)

**Actions prévues** :
- 💾 Backup complet Supabase
- ☁️ Upload vers stockage externe (AWS S3 / Backblaze)
- 📧 Email confirmation backup admin
- ❌ Alert si échec

---

### 🔮 nettoyage-logs.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les dimanches à 4h)

**Actions prévues** :
- 🗑️ Suppression logs > 90 jours
- 🗑️ Suppression executions N8N > 30 jours
- 📊 Rapport statistiques logs
- 💾 Archivage logs importants

---

### 🔮 nettoyage-donnees-temporaires.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 2h)

**Actions prévues** :
- 🗑️ Suppression sessions expirées
- 🗑️ Suppression tokens expirés
- 🗑️ Suppression fichiers temp > 7 jours
- 📊 Rapport espace libéré

---

### 🔮 monitoring-performance.json
**Statut** : À développer  
**Déclencheur** : Cron (toutes les 15 minutes)

**Actions prévues** :
- 📊 Check CPU serveur
- 📊 Check RAM serveur
- 📊 Check espace disque
- 📊 Check temps réponse API
- 📊 Check temps réponse base de données
- 🚨 Alerte si seuils dépassés

---

### 🔮 monitoring-disponibilite.json
**Statut** : À développer  
**Déclencheur** : Cron (toutes les 5 minutes)

**Actions prévues** :
- ✅ Ping application principale
- ✅ Ping N8N
- ✅ Ping Supabase
- 📱 SMS admin si down
- 📧 Email admin avec détails

---

### 🔮 rapport-quotidien.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 8h)

**Actions prévues** :
- 📊 Nombre nouveaux leads (24h)
- 📊 Nombre nouveaux essais (24h)
- 📊 Nombre nouvelles inscriptions (24h)
- 📊 Chiffre d'affaires (24h)
- 📊 Taux de conversion
- 📧 Email récapitulatif admin

---

### 🔮 rapport-hebdomadaire.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les lundis à 9h)

**Actions prévues** :
- 📊 Statistiques semaine écoulée
- 📈 Graphiques évolution
- 💰 Chiffre d'affaires
- 👥 Nouveaux clients
- 📉 Taux d'annulation
- 🎯 Objectifs vs réalisé
- 📧 Email détaillé admin

---

### 🔮 expiration-essais.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 1h)

**Actions prévues** :
- 🔍 Rechercher essais expirés
- 🛑 Désactivation compte
- 📧 Email fin essai + offre
- 🔄 Mise à jour statut `expired`
- 📊 Stats conversion

---

### 🔮 relance-essais-inactifs.json
**Statut** : À développer  
**Déclencheur** : Cron (tous les jours à 10h)

**Actions prévues** :
- 🔍 Rechercher essais actifs sans activité (>3 jours)
- 📧 Email "Besoin d'aide ?"
- 📱 SMS (si aucune connexion)
- 🔔 Proposition démo personnalisée

---

### 🔮 archivage-clients-inactifs.json
**Statut** : À développer  
**Déclencheur** : Cron (1er de chaque mois)

**Actions prévues** :
- 🔍 Rechercher comptes inactifs > 6 mois
- 📧 Email "Voulez-vous réactiver ?"
- ⏰ Attendre 30 jours
- 📦 Archivage données (RGPD)
- 🗑️ Anonymisation après 12 mois

---

### 🔮 update-statistiques.json
**Statut** : À développer  
**Déclencheur** : Cron (toutes les heures)

**Actions prévues** :
- 📊 Mise à jour table `statistics`
- 📈 Calcul KPIs
- 💾 Sauvegarde snapshots
- 🔄 Refresh vues matérialisées

---

## 📊 KPIs à Tracker

### Performance
- ⚡ Temps réponse moyen API
- ⚡ Temps chargement pages
- 💾 Utilisation CPU/RAM
- 💽 Utilisation espace disque
- 🌐 Bande passante utilisée

### Business
- 👥 Utilisateurs actifs (DAU/MAU)
- 💰 MRR (Monthly Recurring Revenue)
- 📈 Taux de conversion (Lead → Essai → Client)
- 📉 Taux de churn (annulations)
- 💵 ARPU (Average Revenue Per User)
- 💎 LTV (Lifetime Value)
- 💸 CAC (Customer Acquisition Cost)

### Support
- 🎫 Nombre tickets support
- ⏱️ Temps réponse moyen
- ✅ Taux de résolution
- ⭐ Score satisfaction

---

## 🚨 Alertes Critiques

### Serveur
- 🔴 CPU > 90% pendant 5 min
- 🔴 RAM > 90%
- 🔴 Disque > 85%
- 🔴 Application down > 1 min

### Base de Données
- 🔴 Connexions > 80% limite
- 🔴 Temps requête > 5s
- 🔴 Erreurs > 50/min

### Business
- 🟡 0 nouveaux leads en 24h
- 🟡 Taux erreur paiement > 10%
- 🔴 Taux annulation > 20% (semaine)

**Canaux alerte** :
- 📱 SMS admin (critique)
- 📧 Email admin (important)
- 🔔 Notification in-app (info)

---

## ⚙️ Configuration Requise

### Credentials N8N
- **Serveur SSH** : Accès root VPS
- **Supabase** : Service Role Key
- **AWS S3 / Backblaze** : Pour backups
- **Twilio** : Pour SMS alertes

### Variables d'environnement
```env
VPS_HOST=votre-serveur.com
VPS_SSH_KEY=/path/to/ssh/key
BACKUP_BUCKET=s3://talos-backups
ADMIN_SMS=+33XXXXXXXXX
ADMIN_EMAIL=admin@talosprimes.com
```

---

## 🗓️ Planning des Tâches Cron

```
# Toutes les 5 minutes
*/5 * * * * monitoring-disponibilite.json

# Toutes les 15 minutes
*/15 * * * * monitoring-performance.json

# Toutes les heures
0 * * * * update-statistiques.json

# Tous les jours
0 1 * * * expiration-essais.json
0 2 * * * nettoyage-donnees-temporaires.json
0 3 * * * backup-database.json
0 8 * * * rapport-quotidien.json
0 10 * * * relance-essais-inactifs.json

# Toutes les semaines
0 4 * * 0 nettoyage-logs.json
0 9 * * 1 rapport-hebdomadaire.json

# Tous les mois
0 0 1 * * archivage-clients-inactifs.json
```

---

## 💾 Stratégie de Backup

### Quotidien (Rétention 7 jours)
- Base de données complète
- Configuration nginx
- Variables d'environnement
- Workflows N8N

### Hebdomadaire (Rétention 4 semaines)
- Archives complètes
- Logs compressés

### Mensuel (Rétention 12 mois)
- Snapshots complets
- Rapports business

---

## 🧪 Tests

### Tester Monitoring
```bash
# Simuler forte charge CPU
curl -X POST https://n8n.talosprimes.com/webhook/test-load

# Vérifier alerte envoyée
# → SMS admin + Email détaillé
```

### Tester Backup
```bash
# Déclencher backup manuel
curl -X POST https://n8n.talosprimes.com/webhook/backup-manual

# Vérifier fichier créé
ls -lh /backups/
```

---

## 📊 Dashboard Monitoring

### Outils à Intégrer
- **UptimeRobot** : Monitoring disponibilité
- **BetterStack** : Logs & monitoring
- **Grafana** : Dashboards personnalisés
- **PM2 Plus** : Monitoring Node.js

---

## 🔧 Maintenance

- **Responsable** : Admin système
- **Statut** : 🔮 Planifié
- **Priorité** : Haute (sécurité & stabilité)
- **Date début prévue** : Après système abonnements

---

## 📚 Ressources

- [Cron Syntax](https://crontab.guru/)
- [N8N Cron Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.cron/)
- [Best Practices Backup](https://www.postgresql.org/docs/current/backup.html)
- [Server Monitoring Best Practices](https://www.digitalocean.com/community/tutorials/how-to-monitor-server-health-and-performance)

