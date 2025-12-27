#!/bin/bash
# Script de diagnostic pour la connexion N8N
# Usage: ./scripts/diagnostic-n8n-connection.sh

set -e

echo "🔍 Diagnostic de la connexion N8N"
echo "=================================="
echo ""

# Variables
N8N_URL="${N8N_URL:-https://n8n.talosprimes.com}"
N8N_USER="${N8N_BASIC_AUTH_USER:-}"
N8N_PASS="${N8N_BASIC_AUTH_PASSWORD:-}"

echo "📋 Configuration:"
echo "   N8N_URL: $N8N_URL"
echo "   N8N_USER: ${N8N_USER:-non configuré}"
echo ""

# 1. Vérifier que N8N est démarré
echo "1️⃣  Vérification de N8N dans PM2..."
if pm2 list | grep -q "n8n"; then
    echo "   ✅ N8N est présent dans PM2"
    pm2 list | grep "n8n"
else
    echo "   ❌ N8N n'est PAS présent dans PM2"
fi
echo ""

# 2. Vérifier le port 5678
echo "2️⃣  Vérification du port 5678..."
if lsof -i :5678 > /dev/null 2>&1; then
    echo "   ✅ Le port 5678 est utilisé"
    lsof -i :5678
else
    echo "   ❌ Le port 5678 n'est PAS utilisé"
fi
echo ""

# 3. Tester la connexion locale
echo "3️⃣  Test de connexion locale (localhost:5678)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401\|302"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)
    echo "   ✅ N8N répond localement (HTTP $HTTP_CODE)"
else
    echo "   ❌ N8N ne répond PAS localement"
fi
echo ""

# 4. Tester la connexion via l'URL publique (avec certificat SSL)
echo "4️⃣  Test de connexion via URL publique ($N8N_URL)..."
if [ -n "$N8N_USER" ] && [ -n "$N8N_PASS" ]; then
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -u "$N8N_USER:$N8N_PASS" "$N8N_URL" || echo "000")
else
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$N8N_URL" || echo "000")
fi

if [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Impossible de se connecter à $N8N_URL"
    echo "   💡 Vérifiez:"
    echo "      - Que N8N est démarré"
    echo "      - Que Nginx est configuré pour proxifier vers N8N"
    echo "      - Que le DNS pointe vers le bon serveur"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ N8N répond via l'URL publique (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  N8N répond avec HTTP $HTTP_CODE (peut être normal selon la config)"
fi
echo ""

# 5. Vérifier la configuration Nginx
echo "5️⃣  Vérification de la configuration Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "n8n.talosprimes.com" "$NGINX_CONFIG"; then
        echo "   ✅ Configuration Nginx trouvée pour n8n.talosprimes.com"
        echo "   📋 Extrait de la config:"
        grep -A 10 "n8n.talosprimes.com" "$NGINX_CONFIG" | head -15
    else
        echo "   ⚠️  Configuration Nginx pour n8n.talosprimes.com non trouvée"
    fi
else
    echo "   ⚠️  Fichier de configuration Nginx non trouvé: $NGINX_CONFIG"
fi
echo ""

# 6. Tester depuis Node.js (comme Next.js le ferait)
echo "6️⃣  Test depuis Node.js (simulation Next.js)..."
cat > /tmp/test-n8n-fetch.js << 'EOF'
const https = require('https');
const url = process.env.N8N_URL || 'https://n8n.talosprimes.com';

const options = {
  method: 'GET',
  rejectUnauthorized: false, // Ignorer les erreurs SSL pour le test
  timeout: 5000
};

console.log(`Test de connexion à: ${url}`);
const req = https.request(url, options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('✅ Connexion réussie');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log(`❌ Erreur: ${error.message}`);
  console.log(`Code: ${error.code}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();
EOF

N8N_URL="$N8N_URL" node /tmp/test-n8n-fetch.js 2>&1 || echo "   ❌ Erreur lors du test Node.js"
rm -f /tmp/test-n8n-fetch.js
echo ""

# 7. Résumé et recommandations
echo "=================================="
echo "📊 Résumé:"
echo ""
echo "Si N8N ne répond pas via l'URL publique mais répond localement:"
echo "   → Vérifiez la configuration Nginx pour n8n.talosprimes.com"
echo ""
echo "Si N8N ne répond pas du tout:"
echo "   → Vérifiez que N8N est démarré: pm2 restart n8n"
echo "   → Vérifiez les logs: pm2 logs n8n --err --lines 20"
echo ""
echo "Si le test Node.js échoue:"
echo "   → Problème de réseau/firewall entre Next.js et N8N"
echo "   → Vérifiez que N8N écoute sur le bon port"
echo ""




