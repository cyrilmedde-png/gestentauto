# PRD - Application SaaS de Gestion d'Entreprise Complète

## 1. Vue d'ensemble du produit

### 1.1 Vision
Créer une plateforme SaaS complète et autonome de gestion d'entreprise permettant aux entreprises de gérer tous les aspects de leur activité sans dépendre de services externes (comptables, juristes, etc.). L'application couvre de la création d'entreprise à la gestion opérationnelle quotidienne.

### 1.2 Objectifs principaux
- **Autonomie totale** : Toutes les fonctionnalités nécessaires intégrées
- **Design moderne et sobre** : Interface épurée, sans traits apparents, tout fondu
- **Modularité** : Architecture modulaire permettant l'activation/désactivation de modules
- **Scalabilité** : Support de tous types d'entreprises (startups à grandes entreprises)
- **Installation simple** : Système d'installation type plateforme (one-click ou script automatisé)
- **Multi-modalité** : Gestion manuelle, automatique et vocale de l'application
- **Intégrations ouvertes** : Connexion avec logiciels métier spécifiques (cabinet médical, dépanneur, etc.)

### 1.3 Public cible
- Tous types d'entreprises (startups, PME, grandes entreprises)
- Entrepreneurs créant leur entreprise
- Gestionnaires et dirigeants d'entreprise
- Équipes administratives et opérationnelles

## 2. Architecture technique

### 2.1 Stack technologique

**Stack principale (définie)** :
- **Frontend** : React 18+ avec TypeScript + Next.js (pour Vercel)
- **Backend** : Next.js API Routes / Serverless Functions (Vercel)
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth (JWT intégré)
- **Stockage fichiers** : Supabase Storage
- **Email** : Resend
- **Paiements** : Stripe
- **Automatisation** : Make (anciennement Integromat)
- **Version control** : GitHub
- **Déploiement** : Vercel
- **ORM** : Prisma (recommandé avec Supabase)

**Outils complémentaires recommandés** :

- **Monitoring & Observabilité** :
  - **Sentry** : Gestion des erreurs et monitoring de performance
  - **Vercel Analytics** : Analytics intégré Vercel
  - **Logtail** ou **Axiom** : Logs centralisés et recherche

- **Cache & Performance** :
  - **Upstash Redis** : Redis serverless pour cache et queues (compatible Vercel)
  - **Vercel Edge Config** : Configuration globale edge

- **Queue & Jobs** :
  - **Inngest** : Workflows et jobs asynchrones (serverless-first)
  - **Trigger.dev** : Alternative pour jobs background

- **Notifications** :
  - **Novu** : Système de notifications multi-canaux (email, SMS, push, in-app)
  - **OneSignal** : Push notifications (optionnel)

- **Analytics & Tracking** :
  - **Posthog** : Product analytics et feature flags
  - **Mixpanel** : Analytics avancés (optionnel)

- **Documentation API** :
  - **Swagger/OpenAPI** : Documentation API automatique
  - **Stoplight** : Design-first API (optionnel)

- **Tests** :
  - **Playwright** : Tests E2E
  - **Vitest** : Tests unitaires (remplace Jest, plus rapide)
  - **Testing Library** : Tests React

- **CI/CD** :
  - **GitHub Actions** : Intégration continue (déjà avec GitHub)
  - **Vercel** : Déploiement automatique (déjà configuré)

- **Design & UI** :
  - **Shadcn/ui** : Composants UI modernes (basé sur Radix UI)
  - **Tailwind CSS** : Styling (recommandé avec Next.js)
  - **Framer Motion** : Animations fluides

- **Formulaires & Validation** :
  - **React Hook Form** : Gestion formulaires performante
  - **Zod** : Validation de schémas TypeScript

- **State Management** :
  - **Zustand** : State management léger
  - **TanStack Query** : Gestion des données serveur (cache, sync)

- **Sécurité** :
  - **Clerk** : Alternative auth (si besoin de plus de features que Supabase Auth)
  - **Rate limiting** : Vercel Edge Middleware ou Upstash Rate Limit

- **PDF & Documents** :
  - **React-PDF** : Génération PDF côté client
  - **Puppeteer** : Génération PDF serveur (via Vercel Functions)
  - **DocuSign API** : Signature électronique (optionnel)

- **Calendrier & Planning** :
  - **FullCalendar** : Composant calendrier
  - **Cal.com API** : Intégration rendez-vous (optionnel)

- **Reconnaissance vocale & IA** :
  - **Web Speech API** : Reconnaissance vocale native navigateur
  - **OpenAI Whisper API** : Transcription vocale avancée
  - **OpenAI GPT-4** : Compréhension et traitement du langage naturel
  - **ElevenLabs** : Synthèse vocale (optionnel)
  - **Deepgram** : Transcription temps réel (alternative)

- **Intégrations & Connecteurs** :
  - **Zapier** : Connecteurs pré-configurés (complémentaire à Make)
  - **n8n** : Alternative open-source à Make (optionnel)
  - **Pipedream** : Automatisations code-first (optionnel)

### 2.2 Architecture applicative

```
┌─────────────────────────────────────────────────┐
│     Frontend (Next.js + React + TypeScript)     │
│  - Pages & App Router                           │
│  - Server Components & Client Components        │
│  - Design System (Shadcn/ui + Tailwind)        │
│  - State Management (Zustand + TanStack Query) │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│     Backend (Next.js API Routes / Serverless)   │
│  - API Routes                                    │
│  - Server Actions (Next.js 14+)                 │
│  - Edge Functions (si nécessaire)                │
│  - Business Logic Layer                          │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│              Supabase                            │
│  - PostgreSQL (base de données)                 │
│  - Auth (authentification)                      │
│  - Storage (fichiers)                           │
│  - Realtime (subscriptions)                     │
│  - Edge Functions (optionnel)                   │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         Services externes                        │
│  - Stripe (paiements)                            │
│  - Resend (email)                               │
│  - Make (automatisations)                       │
│  - Upstash Redis (cache/queues)                 │
│  - Inngest (workflows/jobs)                     │
└─────────────────────────────────────────────────┘
```

### 2.3 Structure des modules

Architecture modulaire avec :

- **Core** : Authentification (Supabase Auth), multi-tenant, paramètres
- **Modules métier** : Chaque module est indépendant mais interconnecté
- **API Routes** : Routage Next.js par module
- **Event Bus** : Communication inter-modules via Supabase Realtime ou Inngest
- **Interface vocale** : Système de commandes vocales intégré
- **API d'intégration** : Connecteurs pour logiciels métier externes

### 2.4 Séparation stricte Plateforme / Clients

**Architecture multi-tenant stricte** :

- **Isolation des données** : Chaque client (entreprise) a ses propres données isolées via `company_id` sur toutes les tables Supabase
- **Row Level Security (RLS)** : Politiques Supabase pour isolation automatique
- **Isolation réseau** : Possibilité de déploiement avec isolation réseau par client (optionnel)
- **Isolation des ressources** : Limites de ressources par client (via Vercel)
- **Sécurité** : Aucune fuite de données entre clients, validation stricte des permissions
- **Audit** : Traçabilité complète des accès et modifications par client

**Couche plateforme** :

- Gestion des clients (onboarding, facturation plateforme via Stripe)
- Administration système
- Monitoring et métriques (Sentry, Vercel Analytics)
- Mises à jour et maintenance
- Support technique

**Couche client** :

- Application métier complète
- Données isolées (RLS Supabase)
- Configuration personnalisée
- Modules activés selon abonnement Stripe
- Storage isolé par client (Supabase Storage buckets)

## 3. Modules fonctionnels détaillés

### 3.0 Approche d'implémentation progressive

**Philosophie** : Implémentation au fur et à mesure selon les besoins identifiés et la priorité métier.

**Stratégie** :
- Développement itératif par sprints
- Modules MVP d'abord, puis enrichissement progressif
- Feedback utilisateurs intégré à chaque itération
- Ajout de nouveaux modules selon demande marché
- Amélioration continue des modules existants

**Priorisation** :
1. Modules essentiels (Core, Facturation, CRM)
2. Modules critiques métier (Comptabilité, RH)
3. Modules complémentaires (selon secteurs d'activité)
4. Modules spécialisés (selon besoins spécifiques)

### 3.1 Module Core / Onboarding

**Fonctionnalités** :
- Création de compte entreprise (Supabase Auth)
- Configuration initiale (secteur, taille, pays)
- Assistant de configuration guidée
- Import de données existantes (CSV, Excel)
- Gestion multi-entreprises (si utilisateur gère plusieurs entités)

**Données** :
- Informations légales entreprise (SIRET, TVA, etc.)
- Adresse, contacts
- Paramètres régionaux (devise, format dates, etc.)

**Intégrations** :
- Supabase Auth pour authentification
- Stripe pour abonnement initial
- Resend pour emails de bienvenue

### 3.2 Module Comptabilité

**Fonctionnalités** :
- Plan comptable (FR, BE, CH selon pays)
- Écritures comptables (manuelles et automatiques)
- Grand livre et balance
- Comptes de résultat et bilans
- Déclaration TVA automatisée
- Rapprochement bancaire
- Pointage automatique
- Export vers logiciels comptables (FEC, EBP, etc.)

**Intégrations** :
- API bancaires (Open Banking via Make)
- Import relevés bancaires (OFX, CSV)
- Génération PDF (React-PDF ou Puppeteer)

### 3.3 Module Ressources Humaines

**Fonctionnalités** :
- Gestion des employés (fiches, contrats)
- Paie automatique (calculs selon législation)
- Gestion des congés et absences
- Tableaux de bord RH
- Évaluations et entretiens
- Gestion des compétences
- Documents RH (contrats, avenants, certificats)

**Conformité** :
- Calculs selon législation locale
- Génération DSN (Déclaration Sociale Nominative) pour France
- Gestion des heures supplémentaires
- Conventions collectives

**Intégrations** :
- Resend pour envoi documents RH
- Supabase Storage pour stockage documents

### 3.4 Module Facturation

**Fonctionnalités** :
- Création devis et factures
- Templates personnalisables
- Gestion des clients et fournisseurs
- Relances automatiques (via Make ou Inngest)
- Paiements en ligne (Stripe)
- Gestion des acomptes et avoirs
- Facturation récurrente
- Export PDF personnalisé

**Automatisations** :
- Génération automatique depuis projets
- Workflows d'approbation
- Envoi automatique par email (Resend)

**Intégrations** :
- Stripe pour paiements
- Resend pour envoi factures
- Make pour workflows complexes

### 3.5 Module Juridique

**Fonctionnalités** :
- Gestion des contrats (clients, fournisseurs, employés)
- Templates de contrats (CGV, CGU, NDA, etc.)
- Suivi des échéances et renouvellements
- Alertes juridiques
- Conformité RGPD
- Gestion des consentements
- Registre des traitements
- Gestion des litiges

**Intégrations** :
- Supabase Storage pour stockage contrats
- Resend pour notifications échéances
- Make pour workflows juridiques

### 3.6 Module Gestion de Stock

**Fonctionnalités** :
- Catalogue produits/services
- Gestion multi-entrepôts
- Suivi des mouvements (entrées, sorties, transferts)
- Alertes de stock minimum
- Inventaires et ajustements
- Valorisation (FIFO, LIFO, moyen pondéré)
- Codes-barres et QR codes
- Import/export

**Intégrations** :
- Supabase Realtime pour mises à jour temps réel
- Inngest pour alertes automatiques

### 3.7 Module CRM

**Fonctionnalités** :
- Base de données clients/prospects
- Historique des interactions
- Pipeline de vente
- Suivi des opportunités
- Email marketing intégré
- Campagnes marketing
- Scoring clients
- Segmentation

**Intégrations** :
- Resend pour email marketing
- Make pour automatisations CRM
- Supabase Realtime pour notifications temps réel

### 3.8 Module Gestion de Projets

**Fonctionnalités** :
- Création et suivi de projets
- Gestion des tâches (Kanban, Gantt)
- Affectation des ressources
- Suivi du temps (timesheet)
- Budget et coûts projet
- Facturation liée aux projets
- Documents projet
- Collaboration (commentaires, notifications)

**Intégrations** :
- Supabase Realtime pour collaboration temps réel
- FullCalendar pour planning

### 3.9 Module Gestion Documentaire

**Fonctionnalités** :
- Stockage centralisé de documents (Supabase Storage)
- Organisation par dossiers et tags
- Versioning
- Recherche full-text (PostgreSQL)
- Partage sécurisé
- Signature électronique
- Archivage automatique
- Templates de documents

**Types de documents** :
- Factures, devis, contrats
- Documents RH
- Documents comptables
- Documents projets

**Intégrations** :
- Supabase Storage pour stockage
- DocuSign API pour signatures (optionnel)

### 3.10 Module Reporting & Analytics

**Fonctionnalités** :
- Tableaux de bord personnalisables
- Rapports pré-configurés (ventes, finances, RH)
- Export (PDF, Excel, CSV)
- Graphiques interactifs
- KPIs en temps réel
- Rapports récurrents (email automatique via Resend)
- Analyse prédictive (optionnel)

**Intégrations** :
- Posthog pour analytics produits
- Vercel Analytics pour performance

### 3.11 Modules métier supplémentaires (à implémenter progressivement)

**Approche** : Ces modules seront développés au fur et à mesure selon les besoins identifiés et la demande marché. Chaque module peut être activé/désactivé par entreprise selon son secteur d'activité.

#### 3.11.1 Module E-commerce / Vente en ligne
- Gestion de boutique en ligne
- Catalogue produits avec images
- Panier et commandes
- Gestion des livraisons
- Intégration paiements en ligne (Stripe)
- Gestion des avis clients

#### 3.11.2 Module Restauration / Horeca
- Gestion des menus
- Réservations de tables
- Gestion des commandes en salle
- Point de vente (POS)
- Gestion des stocks alimentaires (DLUO, traçabilité)
- Gestion des équipes de service

#### 3.11.3 Module Immobilier
- Gestion de portefeuille immobilier
- Gestion des locations
- Suivi des loyers et charges
- Gestion des locataires
- Maintenance et interventions
- Documents légaux (baux, quittances)

#### 3.11.4 Module Santé / Médical
- Gestion des patients
- Dossiers médicaux
- Rendez-vous et planning
- Prescriptions
- Facturation santé (selon pays)
- Conformité RGPD médical

#### 3.11.5 Module Éducation / Formation
- Gestion des étudiants/élèves
- Planning des cours
- Notes et évaluations
- Gestion des inscriptions
- Facturation des formations
- Certificats et attestations

#### 3.11.6 Module Transport / Logistique
- Gestion de flotte de véhicules
- Planning des trajets
- Suivi des livraisons
- Gestion des chauffeurs
- Maintenance véhicules
- Coûts et facturation transport

#### 3.11.7 Module BTP / Construction
- Gestion des chantiers
- Suivi des matériaux
- Planning des équipes
- Gestion des sous-traitants
- Facturation par lots/avancements
- Documents techniques (plans, devis)

#### 3.11.8 Module Conseil / Services
- Gestion des missions
- Suivi du temps facturable
- Gestion des compétences
- Facturation à l'heure/jour
- Gestion des intervenants
- Reporting par client

#### 3.11.9 Module Production / Industrie
- Gestion de la production
- Ordres de fabrication
- Gestion des machines
- Maintenance préventive
- Qualité et contrôle
- Traçabilité produits

#### 3.11.10 Module Agriculture
- Gestion des parcelles
- Suivi des cultures
- Gestion du bétail
- Traçabilité alimentaire
- Gestion des intrants
- Conformité réglementaire

#### 3.11.11 Module Associations / ONG
- Gestion des adhérents
- Cotisations
- Gestion des événements
- Bénévolat
- Subventions et dons
- Reporting associatif

#### 3.11.12 Module Franchise / Réseau
- Gestion multi-points de vente
- Centralisation des données
- Reporting consolidé
- Gestion des franchisés
- Standards et procédures
- Formation et support

**Note** : Ces modules seront développés selon la demande et les besoins identifiés. Chaque module peut être activé/désactivé par entreprise selon son secteur d'activité. L'implémentation se fera progressivement, module par module.

## 4. Workflows et automatisations

### 4.1 Système de workflows

**Principe** : Automatisation des processus métier récurrents via des workflows configurables.

**Moteur de workflow** :
- **Make (Integromat)** : Workflows visuels complexes entre services
- **Inngest** : Workflows code-first pour logique métier
- Conditions et règles métier
- Actions automatiques
- Notifications et alertes
- Gestion des exceptions

### 4.2 Workflows par module

#### 4.2.1 Workflows Facturation
- **Création facture depuis devis** : Validation devis → Génération facture → Envoi automatique (Resend)
- **Relance automatique** : Facture impayée après X jours → Email relance (Resend) → Escalade si nécessaire
- **Workflow d'approbation** : Facture > montant seuil → Validation manager → Validation direction
- **Facturation récurrente** : Planification (Inngest) → Génération automatique → Envoi → Suivi paiement (Stripe)

#### 4.2.2 Workflows Comptabilité
- **Pointage bancaire** : Import relevé (Make) → Matching automatique → Validation manuelle si nécessaire
- **Déclaration TVA** : Calcul périodique (Inngest) → Génération déclaration → Envoi automatique (selon pays)
- **Clôture exercice** : Vérifications → Génération états → Archivage → Ouverture nouvel exercice
- **Rapprochement** : Matching automatique écritures → Alertes écarts → Validation

#### 4.2.3 Workflows RH
- **Onboarding employé** : Création compte (Supabase Auth) → Envoi documents (Resend) → Signature contrats → Configuration accès
- **Gestion des congés** : Demande → Validation manager → Mise à jour planning → Notification équipe (Novu)
- **Processus de paie** : Collecte données → Calculs → Validation → Génération bulletins → Envoi (Resend)
- **Évaluation** : Planification → Envoi formulaire → Remplissage → Entretien → Archivage

#### 4.2.4 Workflows CRM
- **Qualification lead** : Création → Scoring automatique → Attribution commercial → Suivi
- **Pipeline de vente** : Étape par étape avec actions automatiques (emails Resend, rappels)
- **Conversion devis** : Devis accepté → Création commande → Génération facture → Suivi livraison
- **Fidélisation** : Analyse comportement → Segmentation → Campagnes ciblées (Resend)

#### 4.2.5 Workflows Stock
- **Réapprovisionnement** : Stock < seuil → Génération commande fournisseur → Validation → Envoi (Make)
- **Réception marchandise** : Arrivée → Contrôle qualité → Saisie stock → Facture fournisseur
- **Inventaire** : Planification → Génération liste → Saisie → Ajustements → Validation
- **Alertes péremption** : Vérification dates → Alertes X jours avant → Actions correctives (Inngest)

#### 4.2.6 Workflows Projets
- **Lancement projet** : Création → Affectation équipe → Planification → Budget → Démarrage
- **Facturation projet** : Avancement → Calcul % → Génération facture → Validation → Envoi
- **Clôture projet** : Finalisation tâches → Rapprochement budget → Archivage → Reporting
- **Gestion des jalons** : Définition jalons → Suivi → Alertes retard → Actions correctives

#### 4.2.7 Workflows Juridique
- **Renouvellement contrats** : Alertes X jours avant échéance → Rappel (Resend) → Renégociation → Signature
- **Conformité RGPD** : Vérification consentements → Alertes expiration → Renouvellement
- **Gestion litiges** : Signalement → Documentation → Suivi → Résolution → Archivage
- **Approbation contrats** : Création → Révision juridique → Validation → Signature → Archivage

#### 4.2.8 Workflows Documents
- **Archivage automatique** : Documents anciens → Archivage selon règles → Suppression si nécessaire (Inngest)
- **Workflow d'approbation** : Document créé → Révision → Validation → Publication
- **Partage sécurisé** : Demande accès → Validation → Partage temporaire → Révocation automatique
- **Versioning** : Modification → Création version → Notification → Historique

### 4.3 Workflows transversaux

- **Onboarding nouveau client** : Création compte (Supabase) → Configuration → Import données → Formation → Email bienvenue (Resend)
- **Gestion des alertes** : Événements métier → Génération alertes → Notifications (Novu) → Actions
- **Reporting automatique** : Planification (Inngest) → Génération rapports → Envoi email (Resend) → Archivage
- **Sauvegarde et archivage** : Planification → Backup Supabase → Vérification → Archivage long terme

### 4.4 Personnalisation des workflows

- Templates de workflows pré-configurés (Make)
- Personnalisation par entreprise
- Conditions personnalisables
- Actions personnalisées
- Intégration avec modules externes

## 5. Gestion multi-modale : Manuelle, Automatique et Vocale

### 5.1 Vue d'ensemble

L'application supporte trois modes d'interaction pour une gestion totale et flexible :

- **Mode Manuel** : Interface graphique traditionnelle (clavier, souris, tactile)
- **Mode Automatique** : Workflows et automatisations configurés
- **Mode Vocale** : Commandes et interactions vocales

### 5.2 Mode Manuel

**Interface graphique complète** :
- Navigation au clavier et souris
- Interface tactile (tablettes, mobiles)
- Raccourcis clavier pour actions fréquentes
- Drag & drop pour réorganisation
- Formulaires interactifs
- Tableaux de bord personnalisables

**Fonctionnalités** :
- Toutes les opérations accessibles via l'interface
- Création, modification, suppression manuelle
- Import/export de données
- Configuration et paramétrage
- Reporting et visualisation

### 5.3 Mode Automatique

**Automatisations configurables** :

- **Workflows Make** : Automatisations visuelles entre services
- **Workflows Inngest** : Automatisations code-first
- **Règles métier** : Conditions et actions automatiques
- **Planification** : Exécution à intervalles réguliers
- **Déclencheurs** : Événements automatiques (webhooks, changements de données)

**Types d'automatisations** :
- **Temps réel** : Réaction immédiate aux événements
- **Planifiées** : Exécution à heures fixes (quotidienne, hebdomadaire, mensuelle)
- **Conditionnelles** : Déclenchement selon conditions métier
- **Séquentielles** : Chaînes d'actions en cascade

**Exemples d'automatisations** :
- Génération automatique de factures récurrentes
- Relances automatiques de factures impayées
- Calcul et envoi automatique de bulletins de paie
- Alertes automatiques de stock minimum
- Synchronisation automatique avec logiciels externes
- Archivage automatique de documents anciens

### 5.4 Mode Vocale

**Système de commandes vocales intégré** :

#### 5.4.1 Technologies vocales

- **Web Speech API** : Reconnaissance vocale native navigateur
- **OpenAI Whisper API** : Transcription vocale avancée (plus précise)
- **OpenAI GPT-4** : Compréhension du langage naturel et interprétation des commandes
- **ElevenLabs** : Synthèse vocale pour retours audio (optionnel)

#### 5.4.2 Fonctionnalités vocales

**Commandes vocales disponibles** :

- **Navigation** :
  - "Ouvre le module facturation"
  - "Affiche les clients"
  - "Va au tableau de bord"
  - "Ouvre le projet X"

- **Création** :
  - "Crée une nouvelle facture"
  - "Ajoute un client nommé [nom]"
  - "Crée un devis pour [client]"
  - "Enregistre un nouveau produit"

- **Consultation** :
  - "Affiche les factures impayées"
  - "Combien de clients avons-nous ce mois ?"
  - "Quel est le chiffre d'affaires du mois ?"
  - "Liste les tâches en cours"

- **Actions** :
  - "Envoie la facture [numéro] par email"
  - "Valide le devis [numéro]"
  - "Génère le rapport de vente"
  - "Archive les documents de [période]"

- **Recherche** :
  - "Trouve le client [nom]"
  - "Recherche les factures de [mois]"
  - "Affiche les produits en rupture de stock"

#### 5.4.3 Interface vocale

**Activation** :
- Bouton microphone dans l'interface
- Raccourci clavier (ex: Ctrl+Space)
- Commande vocale d'activation : "Assistant" ou "OK [nom app]"
- Activation continue (écoute permanente) optionnelle

**Feedback visuel** :
- Indicateur d'écoute (animation microphone)
- Transcription en temps réel des commandes
- Confirmation visuelle des actions
- Messages d'erreur si commande non comprise

**Feedback audio** :
- Confirmation vocale des actions ("Facture créée avec succès")
- Questions de clarification si ambiguïté
- Synthèse vocale des résultats

#### 5.4.4 Personnalisation vocale

- **Apprentissage** : Adaptation à la voix de l'utilisateur
- **Commandes personnalisées** : Création d'alias pour actions fréquentes
- **Langues** : Support multi-langues (français, anglais, etc.)
- **Vocabulaire métier** : Reconnaissance de termes spécifiques au secteur

#### 5.4.5 Sécurité vocale

- **Authentification** : Reconnaissance vocale pour identification
- **Permissions** : Vérification des droits avant exécution
- **Confirmation** : Demande de confirmation pour actions critiques
- **Logs** : Enregistrement de toutes les commandes vocales

### 5.5 Combinaison des modes

**Modes hybrides** :
- **Manuel + Automatique** : Déclenchement manuel de workflows automatiques
- **Vocale + Automatique** : Commandes vocales déclenchant des workflows
- **Manuel + Vocale** : Utilisation vocale pour navigation, saisie manuelle pour détails
- **Tous modes** : Basculement libre entre les trois modes selon le contexte

**Exemples d'utilisation combinée** :
- Commande vocale : "Crée une facture" → Ouverture formulaire → Saisie manuelle des détails
- Workflow automatique → Notification vocale → Action manuelle de validation
- Navigation vocale → Consultation automatique → Affichage manuel des résultats

## 6. Intégrations avec logiciels métier spécifiques

### 6.1 Vue d'ensemble

L'application permet de se connecter à des logiciels métier spécifiques utilisés par différents secteurs d'activité, permettant une synchronisation bidirectionnelle des données et une gestion unifiée.

### 6.2 Architecture d'intégration

**Composants** :
- **API d'intégration** : API REST/GraphQL pour connexions externes
- **Connecteurs pré-configurés** : Bibliothèque de connecteurs pour logiciels courants
- **Connecteurs personnalisés** : Création de connecteurs sur mesure
- **Make/Zapier** : Intégration via plateformes d'automatisation
- **Webhooks** : Réception d'événements depuis logiciels externes
- **Synchronisation** : Sync bidirectionnelle ou unidirectionnelle

### 6.3 Connecteurs par secteur d'activité

#### 6.3.1 Cabinet médical / Santé

**Logiciels intégrables** :
- **Doctolib** : Synchronisation des rendez-vous
- **Cegedim** : Logiciels de gestion médicale (DxCare, etc.)
- **Axigate** : Logiciels de gestion cabinet médical
- **Mediboard** : Gestion cabinet médical
- **HL7/FHIR** : Standards d'échange de données médicales

**Données synchronisées** :
- Patients et dossiers médicaux
- Rendez-vous et planning
- Prescriptions
- Facturation santé (Tiers Payant, Sécurité Sociale)
- Actes médicaux et tarifs
- Documents médicaux

**Workflows d'intégration** :
- Import automatique des rendez-vous depuis Doctolib
- Export des actes vers logiciel de facturation santé
- Synchronisation des patients
- Génération automatique de factures depuis actes médicaux

#### 6.3.2 Dépanneur automobile / Garage

**Logiciels intégrables** :
- **Garage Partner** : Gestion garage automobile
- **Autofirst** : Logiciel gestion garage
- **GarageSoft** : Gestion atelier automobile
- **Autosphere** : Gestion garage et pièces
- **API constructeurs** : APIs des constructeurs automobiles

**Données synchronisées** :
- Véhicules et historiques
- Interventions et réparations
- Pièces et stock
- Devis et factures
- Clients et véhicules
- Planning des interventions
- Commandes de pièces

**Workflows d'intégration** :
- Import des véhicules depuis logiciel garage
- Synchronisation des interventions
- Export des factures vers notre système
- Gestion unifiée du stock de pièces
- Génération automatique de devis depuis interventions

#### 6.3.3 Comptabilité / Expert-comptable

**Logiciels intégrables** :
- **Sage** : Sage Compta, Sage Paie
- **Ciel** : Ciel Compta, Ciel Gestion Commerciale
- **EBP** : EBP Compta, EBP Gestion
- **Quadratus** : Logiciel comptable
- **FEC** : Fichier des Écritures Comptables (standard)

**Données synchronisées** :
- Plan comptable
- Écritures comptables
- Grand livre
- Déclarations TVA
- Bulletins de paie
- Écritures bancaires

**Workflows d'intégration** :
- Export FEC vers logiciel comptable
- Import des écritures depuis logiciel comptable
- Synchronisation du plan comptable
- Export des déclarations TVA

#### 6.3.4 Point de vente (POS) / Commerce

**Logiciels intégrables** :
- **Square** : Terminal de paiement et POS
- **SumUp** : Solution de paiement mobile
- **Lightspeed** : Système POS
- **Shopify POS** : Point de vente Shopify
- **iZettle** : Terminal de paiement

**Données synchronisées** :
- Transactions de vente
- Produits et catalogue
- Clients
- Stocks
- Paiements

**Workflows d'intégration** :
- Synchronisation des ventes en temps réel
- Mise à jour automatique des stocks
- Import des clients depuis POS
- Export des produits vers POS

#### 6.3.5 E-commerce

**Plateformes intégrables** :
- **Shopify** : Boutique en ligne
- **WooCommerce** : E-commerce WordPress
- **PrestaShop** : Plateforme e-commerce
- **Magento** : E-commerce enterprise
- **Amazon** : Marketplace Amazon

**Données synchronisées** :
- Commandes
- Produits et catalogue
- Clients
- Stocks
- Paiements
- Expéditions

**Workflows d'intégration** :
- Import automatique des commandes
- Synchronisation des stocks
- Export des produits
- Génération automatique de factures depuis commandes

#### 6.3.6 Immobilier

**Logiciels intégrables** :
- **ImmoTop** : Gestion immobilière
- **ImmoSoft** : Logiciel immobilier
- **ImmoWeb** : Portail immobilier
- **API notaires** : Intégration avec systèmes notariaux

**Données synchronisées** :
- Biens immobiliers
- Locations et baux
- Locataires
- Loyers et charges
- Interventions et maintenance

**Workflows d'intégration** :
- Import des biens depuis logiciel immobilier
- Synchronisation des locations
- Génération automatique des quittances de loyer
- Export vers portails immobiliers

#### 6.3.7 Restauration / Horeca

**Logiciels intégrables** :
- **TheFork** : Réservations restaurants
- **OpenTable** : Réservations
- **Deliveroo/Uber Eats** : Commandes livraison
- **TouchBistro** : POS restauration
- **Lightspeed Restaurant** : Gestion restaurant

**Données synchronisées** :
- Réservations
- Commandes
- Menus
- Stocks alimentaires
- Clients

**Workflows d'intégration** :
- Import des réservations depuis TheFork
- Synchronisation des commandes livraison
- Mise à jour des stocks depuis commandes
- Export des menus vers plateformes

### 6.4 Création de connecteurs personnalisés

**API d'intégration** :

- **Endpoints REST** :
  - `POST /api/integrations` : Créer une intégration
  - `GET /api/integrations` : Lister les intégrations
  - `PUT /api/integrations/:id` : Modifier une intégration
  - `DELETE /api/integrations/:id` : Supprimer une intégration
  - `POST /api/integrations/:id/sync` : Déclencher une synchronisation

- **Webhooks** :
  - Configuration de webhooks pour recevoir des événements
  - Validation et traitement des webhooks entrants

- **Authentification** :
  - OAuth 2.0 pour services supportant OAuth
  - API Keys pour authentification simple
  - Webhooks signés pour sécurité

**Documentation développeur** :
- Guide de création de connecteurs
- SDK et bibliothèques
- Exemples de code
- Tests et validation

### 6.5 Synchronisation des données

**Modes de synchronisation** :

- **Temps réel** : Synchronisation immédiate via webhooks
- **Planifiée** : Synchronisation à intervalles (quotidienne, horaire)
- **Manuelle** : Déclenchement manuel par l'utilisateur
- **Hybride** : Combinaison des modes selon le type de données

**Gestion des conflits** :
- Détection des modifications simultanées
- Résolution automatique selon règles
- Notification en cas de conflit nécessitant intervention
- Historique des synchronisations

**Mapping des données** :
- Configuration de correspondance entre champs
- Transformation des données si nécessaire
- Validation avant synchronisation
- Logs détaillés des synchronisations

### 6.6 Sécurité des intégrations

- **Chiffrement** : Données chiffrées en transit (HTTPS)
- **Authentification** : Tokens sécurisés pour chaque intégration
- **Permissions** : Contrôle d'accès granulaires
- **Audit** : Logs de toutes les opérations d'intégration
- **Isolation** : Chaque client a ses propres intégrations isolées

## 7. Design & Expérience utilisateur

### 7.1 Principes de design
- **Sobre et moderne** : Interface épurée, minimaliste
- **Sans traits apparents** : Bordures subtiles, ombres douces
- **Tout fondu** : Dégradés subtils, transitions fluides
- **Cohérence** : Design system unifié (Shadcn/ui)
- **Accessibilité** : WCAG 2.1 AA minimum

### 7.2 Palette de couleurs
- Fond principal : Gris très clair (#F8F9FA) / Blanc
- Accents : Couleur primaire douce (bleu/gris)
- Texte : Gris foncé (#2C3E50)
- Surfaces : Blanc avec ombres subtiles
- États : Couleurs pastel pour hover/active

### 7.3 Composants UI
- Navigation latérale discrète
- Cards avec ombres douces
- Boutons sans bordures visibles
- Inputs avec focus subtil
- Modales avec backdrop flou
- Animations fluides (Framer Motion)

### 7.4 Responsive design

### 7.5 Interface vocale dans le design

**Composants UI vocaux** :
- Bouton microphone flottant (toujours accessible)
- Indicateur d'écoute visuel (animation)
- Zone de transcription en temps réel
- Suggestions de commandes vocales
- Feedback visuel des actions vocales

**Accessibilité** :
- Support des lecteurs d'écran
- Navigation au clavier
- Commandes vocales pour accessibilité
- Mobile-first approach
- Adaptation tablette et desktop
- Navigation adaptative

## 8. Base de données

### 8.1 Schéma principal (Supabase PostgreSQL)

**Tables Core** :
- `companies` : Entreprises
- `users` : Utilisateurs (lié à Supabase Auth)
- `roles` : Rôles et permissions
- `modules` : Modules activés par entreprise
- `settings` : Paramètres globaux et par entreprise

**Tables Comptabilité** :
- `chart_of_accounts` : Plan comptable
- `accounting_entries` : Écritures comptables
- `fiscal_years` : Exercices fiscaux
- `vat_declarations` : Déclarations TVA

**Tables RH** :
- `employees` : Employés
- `contracts` : Contrats de travail
- `payrolls` : Bulletins de paie
- `leaves` : Congés et absences

**Tables Facturation** :
- `customers` : Clients
- `suppliers` : Fournisseurs
- `quotes` : Devis
- `invoices` : Factures
- `payments` : Paiements (lié à Stripe)

**Tables Juridique** :
- `legal_contracts` : Contrats juridiques
- `contract_templates` : Templates
- `legal_alerts` : Alertes

**Tables Stock** :
- `products` : Produits
- `warehouses` : Entrepôts
- `stock_movements` : Mouvements de stock
- `inventories` : Inventaires

**Tables CRM** :
- `contacts` : Contacts (clients/prospects)
- `opportunities` : Opportunités
- `deals` : Affaires
- `interactions` : Interactions

**Tables Projets** :
- `projects` : Projets
- `tasks` : Tâches
- `time_entries` : Pointages temps
- `project_budgets` : Budgets projet

**Tables Documents** :
- `documents` : Métadonnées documents (fichiers dans Supabase Storage)
- `document_versions` : Versions
- `document_shares` : Partages

**Tables Workflows** :
- `workflows` : Définitions de workflows
- `workflow_instances` : Instances de workflows en cours
- `workflow_steps` : Étapes d'un workflow
- `workflow_actions` : Actions à exécuter
- `workflow_conditions` : Conditions de déclenchement
- `workflow_executions` : Historique des exécutions
- `workflow_notifications` : Notifications liées aux workflows

**Tables Intégrations** :
- `integrations` : Intégrations configurées par entreprise
- `integration_connectors` : Connecteurs disponibles
- `integration_mappings` : Mapping des données entre systèmes
- `integration_syncs` : Historique des synchronisations
- `integration_webhooks` : Configuration des webhooks
- `integration_logs` : Logs des opérations d'intégration

**Tables Gestion vocale** :
- `voice_commands` : Commandes vocales disponibles
- `voice_sessions` : Sessions vocales utilisateurs
- `voice_transcriptions` : Transcriptions des commandes
- `voice_actions` : Actions exécutées via commandes vocales
- `voice_preferences` : Préférences vocales par utilisateur

### 8.2 Relations

- Multi-tenant : Toutes les tables liées à `company_id`
- Soft deletes : `deleted_at` sur toutes les tables
- Audit : `created_at`, `updated_at`, `created_by`, `updated_by`
- Indexation : Index sur clés étrangères et champs de recherche fréquents
- Contraintes : Validation stricte des `company_id` à tous les niveaux (DB, API, application)

### 8.3 Row Level Security (RLS)

**Politiques Supabase** :
- Isolation automatique par `company_id`
- Politiques par table selon rôles
- Validation au niveau base de données
- Performance optimisée avec index

### 8.4 Supabase Storage

**Buckets organisés** :
- `documents` : Documents généraux
- `invoices` : Factures et devis
- `contracts` : Contrats juridiques
- `hr-documents` : Documents RH
- `products` : Images produits
- `company-assets` : Assets entreprise

**Sécurité** :
- Accès contrôlé par RLS
- Isolation par `company_id`
- URLs signées pour partage temporaire

## 9. Installation et déploiement

### 9.1 Système d'installation

**Stack Vercel + Supabase** :

1. **Configuration Supabase** :
   - Création projet Supabase
   - Configuration base de données
   - Migration schéma (Prisma ou SQL)
   - Configuration Auth
   - Configuration Storage

2. **Configuration Vercel** :
   - Connexion repository GitHub
   - Configuration variables d'environnement
   - Déploiement automatique

3. **Scripts d'installation** :
   - `setup.sh` : Script d'initialisation
   - Configuration automatique via CLI
   - Vérification des prérequis

### 9.2 Prérequis

- Compte Supabase
- Compte Vercel
- Compte GitHub
- Compte Stripe
- Compte Resend
- Compte Make (optionnel)
- Node.js 18+ (pour développement local)

### 9.3 Configuration initiale

**Variables d'environnement** :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# Make
MAKE_API_KEY= (optionnel)

# Autres
NEXT_PUBLIC_APP_URL=
```

**Scripts** :
- `npm run setup` : Configuration initiale
- `npm run db:migrate` : Migration base de données
- `npm run db:seed` : Données de test

### 9.4 Déploiement continu

- **GitHub Actions** : Tests automatiques
- **Vercel** : Déploiement automatique sur push
- **Environnements** : Development, Staging, Production
- **Preview deployments** : Pour chaque PR

## 10. Sécurité

### 10.1 Authentification

- **Supabase Auth** : JWT avec refresh tokens
- Mots de passe hashés (géré par Supabase)
- 2FA optionnel (via Supabase)
- OAuth (Google, Microsoft) via Supabase
- Magic links (email)

### 10.2 Autorisation

- **RBAC** : Role-Based Access Control
- Permissions granulaires par module
- Isolation multi-tenant stricte (RLS Supabase)
- Validation au niveau API et base de données

### 10.3 Données

- Chiffrement au repos (Supabase)
- Chiffrement en transit (HTTPS obligatoire)
- Backup automatique (Supabase)
- Conformité RGPD
- Row Level Security (RLS) pour isolation

### 10.4 Isolation multi-tenant stricte

**Mécanismes d'isolation** :

- **Niveau base de données** :
  - Row Level Security (RLS) Supabase sur toutes les tables
  - Contraintes `FOREIGN KEY` avec `company_id`
  - Index composés `(company_id, id)` pour performance
  - Politiques RLS par rôle

- **Niveau application** :
  - Middleware vérifiant `company_id` sur toutes les requêtes
  - Validation stricte des permissions avant chaque opération
  - Filtrage automatique des résultats par `company_id`
  - Logs d'audit pour détecter tentatives d'accès non autorisées

- **Niveau API** :
  - Validation du `company_id` dans le token JWT Supabase
  - Vérification de cohérence entre token et requête
  - Rate limiting par client (Vercel ou Upstash)
  - Quotas de ressources par client

- **Niveau infrastructure** :
  - Storage isolé par buckets et RLS
  - Edge Functions isolées par client (si utilisées)

## 11. Intégrations externes

### 11.1 Bancaires

- Open Banking (Plaid, Yodlee) via Make
- Import relevés bancaires (OFX, CSV)
- Webhooks pour transactions

### 11.2 Paiements

- **Stripe** :
  - Paiements en ligne
  - Abonnements récurrents
  - Facturation plateforme
  - Webhooks pour événements

### 11.3 Communication

- **Resend** :
  - Emails transactionnels
  - Emails marketing
  - Templates personnalisables

- **Novu** (recommandé) :
  - Notifications multi-canaux
  - In-app notifications
  - SMS (via Twilio intégré)

- **Make** :
  - Automatisations email complexes
  - Intégrations multiples services

### 11.4 Juridique

- API juridiques pour vérifications (via Make)
- Bases de données légales
- DocuSign pour signatures électroniques (optionnel)

### 11.5 Monitoring & Analytics

- **Sentry** : Gestion erreurs et performance
- **Vercel Analytics** : Analytics intégré
- **Posthog** : Product analytics
- **Logtail/Axiom** : Logs centralisés

## 12. Roadmap de développement

### Phase 1 : MVP - Fondations (3-4 mois)

**Objectif** : Mise en place de l'infrastructure de base et modules essentiels

- **Core** :
  - Configuration Supabase (Auth, DB, Storage)
  - Authentification et autorisation
  - Multi-tenant avec RLS
  - Paramètres et configuration
  - Design system (Shadcn/ui + Tailwind)

- **Modules MVP** :
  - Module Facturation (devis, factures basiques)
  - Module CRM (base clients/prospects)
  - Module Documents (stockage Supabase Storage)

- **Infrastructure** :
  - Configuration Vercel
  - Base de données avec schéma core
  - API Routes Next.js
  - Intégration Stripe (abonnements)
  - Intégration Resend (emails)

### Phase 2 : Modules essentiels (2-3 mois)

**Objectif** : Ajout des modules critiques pour la gestion d'entreprise

- **Modules métier** :
  - Module Comptabilité (écritures, grand livre, balance)
  - Module RH (employés, contrats, paie basique)
  - Module Stock (catalogue, mouvements, inventaires)

- **Fonctionnalités** :
  - Workflows basiques (Inngest)
  - Reporting basique (tableaux de bord)
  - Export de données (PDF, Excel)

### Phase 3 : Workflows et automatisations (2-3 mois)

**Objectif** : Automatisation des processus métier

- **Système de workflows** :
  - Configuration Make pour workflows complexes
  - Intégration Inngest pour workflows code
  - Workflows par module (facturation, comptabilité, RH, etc.)
  - Notifications automatiques (Novu)

- **Améliorations** :
  - Module Reporting avancé
  - Personnalisation des workflows
  - Intégrations externes avancées

### Phase 3.5 : Interface vocale (2-3 mois, en parallèle)

**Objectif** : Implémentation de la gestion vocale

- **Technologies vocales** :
  - Intégration Web Speech API
  - Intégration OpenAI Whisper pour transcription avancée
  - Intégration OpenAI GPT-4 pour compréhension du langage naturel
  - Système de commandes vocales

- **Fonctionnalités** :
  - Commandes vocales de base (navigation, consultation)
  - Commandes vocales avancées (création, modification)
  - Interface vocale dans tous les modules
  - Personnalisation et apprentissage
  - Feedback visuel et audio

- **Sécurité** :
  - Authentification vocale
  - Validation des permissions
  - Logs des commandes vocales

### Phase 4 : Modules avancés et intégrations (2-3 mois)

**Objectif** : Enrichissement fonctionnel et intégrations

- **Modules complémentaires** :
  - Module Juridique complet
  - Module Projets (gestion complète)
  - Amélioration modules existants

- **Fonctionnalités** :
  - Analytics avancés (Posthog)
  - Intégrations bancaires (Make)
  - Paiements en ligne avancés (Stripe)

- **API d'intégration** :
  - Développement de l'API d'intégration
  - Connecteurs pré-configurés pour secteurs prioritaires :
    - Cabinet médical (Doctolib, Cegedim)
    - Dépanneur automobile (Garage Partner, Autofirst)
    - Comptabilité (Sage, Ciel, EBP)
    - Point de vente (Square, SumUp)
  - Documentation développeur
  - Système de webhooks
  - Synchronisation bidirectionnelle

### Phase 5 : Modules métier spécialisés (implémentation progressive)

**Objectif** : Ajout de modules selon besoins marché

**Approche** :
- Analyse des besoins par secteur
- Développement itératif module par module
- Priorisation selon demande clients
- Feedback utilisateurs intégré

**Modules à développer progressivement** :
- E-commerce / Vente en ligne
- Restauration / Horeca
- Immobilier
- Santé / Médical
- Éducation / Formation
- Transport / Logistique
- BTP / Construction
- Conseil / Services
- Production / Industrie
- Agriculture
- Associations / ONG
- Franchise / Réseau

**Critères de priorisation** :
- Demande marché
- Complexité technique
- Potentiel de revenus
- Synergies avec modules existants

### Phase 6 : Optimisations et scalabilité (continu)

**Objectif** : Amélioration continue

- Performance et optimisation
- UX/UI refinements
- Documentation complète
- Tests et corrections
- Scalabilité infrastructure (Vercel, Supabase)
- Sécurité renforcée
- Monitoring avancé (Sentry, Logtail)

## 13. Métriques de succès

- Temps de configuration initiale < 30 minutes
- Taux d'adoption des modules > 70%
- Satisfaction utilisateur > 4/5
- Temps de chargement < 2s (Vercel Edge)
- Disponibilité > 99.5%
- Taux d'erreur < 0.1% (Sentry)

## 14. Documentation

- Guide utilisateur par module
- Documentation API (Swagger/OpenAPI)
- Guide d'installation
- FAQ
- Tutoriels vidéo (optionnel)
- Documentation développeur (GitHub)

## 15. Architecture de séparation Plateforme / Clients

### 15.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│              COUCHE PLATEFORME (Admin)                   │
│  - Gestion des clients (onboarding, facturation Stripe) │
│  - Administration système                               │
│  - Monitoring et métriques (Sentry, Vercel Analytics)  │
│  - Mises à jour et maintenance                          │
│  - Support technique                                    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              COUCHE APPLICATION (Clients)                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Client 1    │  │  Client 2    │  │  Client N    │ │
│  │  (Entreprise)│  │  (Entreprise)│  │  (Entreprise)│ │
│  │              │  │              │  │              │ │
│  │  - Données   │  │  - Données   │  │  - Données   │ │
│  │    isolées   │  │    isolées   │  │    isolées   │ │
│  │    (RLS)     │  │    (RLS)     │  │    (RLS)     │ │
│  │  - Modules    │  │  - Modules    │  │  - Modules    │ │
│  │    activés   │  │    activés   │  │    activés   │ │
│  │  - Config     │  │  - Config     │  │  - Config     │ │
│  │  - Storage    │  │  - Storage    │  │  - Storage    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 15.2 Isolation des données

**Stratégie d'isolation** :

1. **Isolation logique** (par défaut avec Supabase RLS) :
   - Toutes les tables avec `company_id`
   - Row Level Security (RLS) automatique
   - Filtrage systématique dans toutes les requêtes
   - Validation stricte au niveau application

2. **Isolation storage** :
   - Buckets Supabase Storage organisés
   - RLS sur les buckets
   - URLs signées pour partage sécurisé

3. **Isolation réseau** (optionnel, sécurité renforcée) :
   - Vercel Edge Functions isolées
   - Rate limiting par client

### 15.3 Gestion plateforme

**Fonctionnalités plateforme** :

- **Onboarding clients** :
  - Création compte entreprise (Supabase Auth)
  - Configuration initiale
  - Activation modules selon abonnement Stripe
  - Migration données (si nécessaire)

- **Facturation plateforme** :
  - Gestion des abonnements (Stripe)
  - Facturation récurrente
  - Gestion des paiements
  - Tableaux de bord revenus

- **Administration** :
  - Monitoring santé système (Sentry, Vercel)
  - Gestion des ressources
  - Logs et audit (Logtail/Axiom)
  - Backup et restauration (Supabase)

- **Support** :
  - Tickets support
  - Documentation
  - Formation clients
  - Maintenance

### 15.4 Contrôle d'accès

**Niveaux d'accès** :

1. **Super Admin** (plateforme) :
   - Accès à tous les clients
   - Administration système
   - Configuration globale

2. **Admin Client** (entreprise) :
   - Accès uniquement à son entreprise (RLS)
   - Configuration de son instance
   - Gestion utilisateurs de son entreprise

3. **Utilisateurs** (entreprise) :
   - Accès selon rôles et permissions
   - Limité aux modules activés
   - Données de leur entreprise uniquement (RLS)

---

**Note** : Ce PRD est un document vivant qui évoluera selon les retours utilisateurs et les besoins métier identifiés. L'implémentation se fera de manière progressive, module par module, selon les priorités métier et la demande marché.

**Stack technique validée** :
- ✅ Supabase (PostgreSQL, Auth, Storage)
- ✅ Make (automatisations)
- ✅ Resend (email)
- ✅ Stripe (paiements)
- ✅ GitHub (version control)
- ✅ Vercel (déploiement)

**Outils complémentaires recommandés** :
- Sentry (monitoring erreurs)
- Inngest (workflows code)
- Novu (notifications)
- Posthog (analytics)
- Upstash Redis (cache)
- Shadcn/ui + Tailwind (UI)
- Prisma (ORM)

