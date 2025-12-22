# 📋 Ce qui reste à faire dans le module Leads/Onboarding

## ✅ Ce qui est DÉJÀ TERMINÉ

### Workflow complet
- ✅ Création/modification/suppression de leads
- ✅ Formulaire questionnaire (QuestionnaireForm) intégré
- ✅ Formulaire entretien (InterviewForm) intégré
- ✅ Bouton pour démarrer l'essai gratuit
- ✅ Envoi automatique d'emails et SMS à chaque étape
- ✅ Recommandations automatiques de modules
- ✅ Design responsive (mobile/tablette)

### API Backend
- ✅ Toutes les routes API nécessaires existent et fonctionnent
- ✅ Gestion des erreurs et validation
- ✅ Intégration email (Resend) et SMS (Twilio)

---

## ❌ Ce qui MANQUE encore

### 1. 🎨 Améliorations UX/UI (PRIORITÉ MOYENNE)

#### A. Affichage des recommandations
- ❌ **Affichage visuel des modules recommandés** dans la page de détail
  - Actuellement : Les recommandations sont calculées mais pas très visibles
  - À faire : Card dédiée avec badges colorés pour chaque module recommandé

#### B. Timeline/Chronologie visuelle
- ❌ **Timeline du parcours d'onboarding**
  - Afficher visuellement les étapes : Pré-inscription → Questionnaire → Entretien → Essai → Conversion
  - Indicateur de progression
  - Dates clés visibles

#### C. Modal de démarrage d'essai amélioré
- ❌ **Remplacer l'`alert()` par une modal propre**
  - Actuellement : Utilise `alert()` pour afficher les identifiants
  - À faire : Modal avec design cohérent affichant :
    - Configuration de l'essai
    - Modules activés
    - Identifiants de connexion (avec bouton copier)
    - Lien de connexion

#### D. Boutons d'actions rapides
- ❌ **Actions contextuelles selon l'étape**
  - "Envoyer rappel questionnaire" (si non complété)
  - "Renvoyer identifiants" (si essai démarré)
  - "Convertir en client" (si essai terminé)

### 2. 📊 Statistiques et Analytics (PRIORITÉ BASSE)

- ❌ **Dashboard avec métriques**
  - Taux de conversion par étape
  - Temps moyen par étape
  - Taux d'abandon
  - Graphiques de progression

### 3. 🔍 Recherche et filtres avancés (PRIORITÉ BASSE)

- ❌ **Recherche textuelle**
  - Par nom, email, entreprise
  - Dans la liste des leads

- ❌ **Filtres additionnels**
  - Par date de création (période)
  - Par secteur d'activité (si ajouté au questionnaire)
  - Par taille d'entreprise

### 4. 📧 Automatisations supplémentaires (PRIORITÉ BASSE)

- ❌ **Rappels automatiques programmés**
  - Rappel questionnaire non complété (après 3 jours)
  - Rappel entretien non planifié (après questionnaire)
  - Rappel avant fin d'essai (2 jours avant)

- ❌ **Workflow de relance automatique**
  - Via Inngest ou cron jobs
  - Conditions configurables

### 5. 📝 Logs et historique (PRIORITÉ BASSE)

- ❌ **Table d'activités pour tracer toutes les actions**
  ```sql
  CREATE TABLE lead_activities (
    id UUID PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    action VARCHAR(100), -- 'email_sent', 'sms_sent', 'status_changed', etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- ❌ **Affichage de l'historique dans la page détail**
  - Timeline des actions
  - Emails/SMS envoyés
  - Changements de statut

### 6. 🔐 Améliorations de sécurité (PRIORITÉ BASSE)

- ❌ **Permissions granulaires**
  - Qui peut voir/modifier/supprimer les leads ?
  - Permissions par rôle

- ❌ **Audit log des actions sensibles**
  - Qui a supprimé un lead ?
  - Qui a modifié les informations ?
  - Quand ?

### 7. 📤 Export/Import (PRIORITÉ BASSE)

- ❌ **Export CSV/Excel**
  - Export de la liste des leads avec filtres appliqués
  - Inclure toutes les colonnes pertinentes

- ❌ **Import en masse**
  - Upload CSV pour créer plusieurs leads
  - Validation des données

### 8. 🌐 Interface publique (OPTIONNEL)

Si vous voulez que les leads remplissent eux-mêmes le questionnaire :

- ❌ **Page publique de pré-inscription**
  - `/onboarding` - Formulaire public
  - Génération de token unique

- ❌ **Page publique de questionnaire**
  - `/questionnaire/[token]` - Accès sécurisé par token
  - Auto-complétion du questionnaire

---

## 🎯 Recommandations par priorité

### 🔴 PRIORITÉ HAUTE (À faire maintenant)

1. **Modal de démarrage d'essai** - Remplacer l'alert() par une vraie modal
2. **Affichage visuel des recommandations** - Card dédiée avec badges

### 🟡 PRIORITÉ MOYENNE (À faire prochainement)

3. **Timeline visuelle** - Indicateur de progression du parcours
4. **Boutons d'actions rapides** - Actions contextuelles selon l'étape
5. **Recherche textuelle** - Dans la liste des leads

### 🟢 PRIORITÉ BASSE (Plus tard)

6. Statistiques dashboard
7. Rappels automatiques programmés
8. Logs et historique
9. Export/Import CSV
10. Interface publique

---

## 📝 Notes importantes

### Ce qui fonctionne déjà bien ✅
- Le workflow complet backend/frontend fonctionne
- Les emails et SMS sont envoyés automatiquement
- Les formulaires sont intégrés et fonctionnels
- Le design est responsive

### Points d'attention ⚠️
- L'endpoint trial utilise `/trial/start` dans le code mais `/trial` dans l'API route - vérifier la cohérence
- Le modal d'identifiants utilise `alert()` - à remplacer par une modal propre
- Pas de visibilité sur les recommandations de modules dans l'UI

---

## 🚀 Prochaines étapes suggérées

1. **Créer une modal pour afficher les identifiants de l'essai** (remplacer alert)
2. **Ajouter une card d'affichage des recommandations** dans la page détail
3. **Ajouter une timeline visuelle** du parcours d'onboarding

Ces 3 améliorations UX rendront l'interface beaucoup plus professionnelle et utilisable.

