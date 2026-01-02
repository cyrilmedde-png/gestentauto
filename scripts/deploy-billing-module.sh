#!/bin/bash

# 🚀 Script Déploiement Module Facturation
# Date: 2026-01-01

echo "🚀 DÉPLOIEMENT MODULE FACTURATION - Talosprime"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Étape 1: Pull Code
echo -e "${YELLOW}ÉTAPE 1/4: Pull derniers changements...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur git pull${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code mis à jour${NC}"
echo ""

# Étape 2: Install Dépendances
echo -e "${YELLOW}ÉTAPE 2/4: Installation dépendances...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur npm install${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

# Étape 3: Build
echo -e "${YELLOW}ÉTAPE 3/4: Build production...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# Étape 4: Restart PM2
echo -e "${YELLOW}ÉTAPE 4/4: Redémarrage PM2...${NC}"
pm2 restart talosprime

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur PM2${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PM2 redémarré${NC}"
echo ""

# Vérification Status
echo -e "${YELLOW}Vérification status...${NC}"
pm2 status talosprime

echo ""
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ !${NC}"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "1. Exécuter migrations SQL dans Supabase"
echo "   - database/create_billing_module.sql"
echo "   - database/add_electronic_invoicing.sql"
echo ""
echo "2. Configurer N8N"
echo "   - Importer 6 workflows depuis n8n-workflows/facturation/"
echo "   - Configurer credentials (Resend SMTP + Supabase)"
echo "   - Activer tous les workflows"
echo ""
echo "3. Consulter documentation complète:"
echo "   - docs/DEPLOIEMENT_MODULE_FACTURATION.md"
echo ""
echo "💡 Vérifier logs: pm2 logs talosprime"
echo ""

