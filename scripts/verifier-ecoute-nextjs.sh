#!/bin/bash
# Script pour vérifier sur quelle interface Next.js écoute

echo "🔍 Vérification de l'écoute de Next.js"
echo "======================================"
echo ""

# Vérifier PM2
echo "1️⃣  Statut PM2:"
pm2 list | grep talosprime
echo ""

# Vérifier les processus Node.js
echo "2️⃣  Processus Node.js écoutant sur le port 3000:"
netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000 || lsof -i :3000 2>/dev/null || echo "⚠️  Commande non disponible"
echo ""

# Tester localhost
echo "3️⃣  Test localhost:3000:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000 || echo "❌ Échec"
echo ""

# Tester 127.0.0.1
echo "4️⃣  Test 127.0.0.1:3000:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000 || echo "❌ Échec"
echo ""

# Vérifier la configuration PM2
echo "5️⃣  Configuration PM2:"
pm2 describe talosprime | grep -A 5 "script path\|exec cwd\|interpreter" || echo "⚠️  Informations non disponibles"
echo ""

# Vérifier les variables d'environnement
echo "6️⃣  Variables d'environnement (HOST, PORT):"
pm2 describe talosprime | grep -E "HOST|PORT" || echo "⚠️  Variables non définies explicitement"
echo ""

echo "======================================"
echo "💡 Si 127.0.0.1 échoue mais localhost fonctionne,"
echo "   Next.js pourrait ne pas écouter sur toutes les interfaces."
echo "   Solution: Forcer Next.js à écouter sur 0.0.0.0"
