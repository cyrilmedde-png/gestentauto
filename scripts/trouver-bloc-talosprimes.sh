#!/bin/bash
# Script pour trouver tous les blocs server qui correspondent à talosprimes.com
# Usage: ./scripts/trouver-bloc-talosprimes.sh

echo "🔍 Recherche des blocs server pour talosprimes.com"
echo "=================================================="
echo ""

# Afficher tous les blocs server avec listen 443
echo "1️⃣  Tous les blocs server HTTPS (port 443):"
echo "-------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0; in_block=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_default=0
    has_location=0
    location_content=""
}
/default_server/ && in_block {
    has_default=1
}
/server_name/ && in_block {
    server_name=$0
}
/location \// && in_block {
    has_location=1
    getline
    while ($0 !~ /^[[:space:]]*}/ && !/proxy_pass/) {
        location_content=location_content $0 "\n"
        getline
    }
    if (/proxy_pass/) {
        location_content=location_content $0 "\n"
    }
}
/^}/ && in_block {
    print "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print "Bloc #" block_num ":"
    print "  " listen_line
    if (has_default) {
        print "  ⚠️  default_server (intercepte tout)"
    }
    print "  " server_name
    if (has_location) {
        print "  ✅ A location /"
        if (location_content ~ /proxy_pass/) {
            print "  ✅ Avec proxy_pass"
        } else {
            print "  ❌ SANS proxy_pass"
        }
    } else {
        print "  ❌ PAS de location /"
    }
    print ""
    in_block=0
    server_name=""
    has_default=0
    has_location=0
    location_content=""
}
'
echo ""

# Vérifier spécifiquement les blocs pour talosprimes.com
echo "2️⃣  Blocs qui correspondent à talosprimes.com (avec ou sans www):"
echo "----------------------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0; in_block=0; found_any=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_default=0
    matches_talosprimes=0
}
/default_server/ && in_block {
    has_default=1
}
/server_name/ && in_block {
    server_name=$0
    if (server_name ~ /talosprimes\.com/) {
        matches_talosprimes=1
        found_any=1
    }
}
/^}/ && in_block {
    if (matches_talosprimes) {
        print "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print "Bloc #" block_num " - CORRESPOND À talosprimes.com:"
        print "  " listen_line
        if (has_default) {
            print "  ⚠️  default_server (INTERCEPTE TOUT)"
        }
        print "  " server_name
        print ""
    }
    in_block=0
    matches_talosprimes=0
}
END {
    if (!found_any) {
        print "❌ Aucun bloc trouvé pour talosprimes.com"
    }
}
'
echo ""

# Vérifier quel bloc correspond pour talosprimes.com (sans www)
echo "3️⃣  Test de correspondance pour talosprimes.com (SANS www):"
echo "----------------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0; in_block=0; found_match=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_default=0
    matches_exact=0
    matches_wildcard=0
}
/default_server/ && in_block {
    has_default=1
}
/server_name.*talosprimes\.com[^.]/ && in_block && !/www\.talosprimes\.com/ {
    matches_exact=1
    server_name=$0
}
/server_name.*\.talosprimes\.com/ && in_block && !/www\.talosprimes\.com/ {
    matches_wildcard=1
    server_name=$0
}
/^}/ && in_block {
    if (matches_exact || matches_wildcard) {
        found_match=1
        print "✅ Bloc #" block_num " correspond à talosprimes.com (sans www):"
        print "   " listen_line
        if (has_default) {
            print "   ⚠️  default_server"
        }
        print "   " server_name
        print ""
    }
    in_block=0
    matches_exact=0
    matches_wildcard=0
}
END {
    if (!found_match) {
        print "❌ Aucun bloc trouvé pour talosprimes.com (sans www)"
        print "   Les requêtes vers talosprimes.com (sans www) seront interceptées"
        print "   par le bloc default_server ou le premier bloc qui correspond."
    }
}
'
echo ""

# Vérifier quel bloc correspond pour www.talosprimes.com
echo "4️⃣  Test de correspondance pour www.talosprimes.com:"
echo "---------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0; in_block=0; found_match=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_default=0
    matches_www=0
}
/default_server/ && in_block {
    has_default=1
}
/server_name.*www\.talosprimes\.com/ && in_block {
    matches_www=1
    server_name=$0
}
/^}/ && in_block {
    if (matches_www) {
        found_match=1
        print "✅ Bloc #" block_num " correspond à www.talosprimes.com:"
        print "   " listen_line
        if (has_default) {
            print "   ⚠️  default_server"
        }
        print "   " server_name
        print ""
    }
    in_block=0
    matches_www=0
}
END {
    if (!found_match) {
        print "❌ Aucun bloc trouvé pour www.talosprimes.com"
    }
}
'
echo ""

# Test réel avec curl pour talosprimes.com (sans www)
echo "5️⃣  Test réel avec curl pour talosprimes.com (SANS www):"
echo "--------------------------------------------------------"
RESPONSE=$(curl -s -k -H "Host: talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n 2>&1 | head -20)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!'"
    echo "   📋 Réponse:"
    echo "$RESPONSE"
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE"
fi
echo ""

# Test réel avec curl pour www.talosprimes.com
echo "6️⃣  Test réel avec curl pour www.talosprimes.com:"
echo "------------------------------------------------"
RESPONSE=$(curl -s -k -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n 2>&1 | head -20)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!'"
    echo "   📋 Réponse:"
    echo "$RESPONSE"
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE"
fi
echo ""

echo "=================================================="
echo "💡 Si le navigateur voit 'Welcome to nginx!',"
echo "   vérifiez que vous accédez via https://www.talosprimes.com"
echo "   et non https://talosprimes.com (sans www)"
echo ""




