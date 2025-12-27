#!/bin/bash
# Script pour activer N8N dans PM2 (démarrage automatique)
# Usage: sudo bash scripts/enable-n8n-pm2.sh

echo "🔧 Activation du démarrage automatique N8N dans PM2"
echo "==================================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root"
fi

# 1. Vérifier que N8N est dans PM2
echo "1️⃣ Vérification de N8N dans PM2..."
echo "-----------------------------------"
if ! pm2 list 2>/dev/null | grep -qi n8n; then
    echo "❌ N8N non trouvé dans PM2"
    echo "   💡 Démarrez d'abord N8N avec: bash scripts/fix-n8n-pm2.sh"
    exit 1
fi

echo "✅ N8N trouvé dans PM2"
echo ""

# 2. Sauvegarder la configuration PM2
echo "2️⃣ Sauvegarde de la configuration PM2..."
echo "----------------------------------------"
pm2 save
echo "✅ Configuration sauvegardée"
echo ""

# 3. Activer le démarrage automatique PM2
echo "3️⃣ Activation du démarrage automatique PM2..."
echo "---------------------------------------------"

# Vérifier si le service systemd existe
if systemctl list-unit-files 2>/dev/null | grep -q "pm2-root.service"; then
    echo "✅ Service PM2 systemd trouvé"
    
    # Vérifier s'il est activé
    if systemctl is-enabled pm2-root.service 2>/dev/null | grep -q "enabled"; then
        echo "✅ Service PM2 déjà activé"
    else
        echo "📝 Activation du service PM2..."
        systemctl enable pm2-root.service 2>/dev/null || {
            echo "⚠️  Impossible d'activer via systemctl, utilisation de pm2 startup..."
            STARTUP_CMD=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | head -1)
            if [ -n "$STARTUP_CMD" ]; then
                echo "   💡 Exécutez cette commande:"
                echo "      $STARTUP_CMD"
            fi
        }
    fi
else
    echo "📝 Configuration du démarrage automatique PM2..."
    STARTUP_CMD=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | head -1)
    if [ -n "$STARTUP_CMD" ]; then
        echo "   💡 Exécutez cette commande pour activer le démarrage automatique:"
        echo "      $STARTUP_CMD"
        echo ""
        echo "   Ou exécutez directement:"
        eval "$STARTUP_CMD" 2>/dev/null || {
            echo "   ⚠️  Commande échouée, exécutez-la manuellement"
        }
    else
        echo "   ⚠️  Impossible de générer la commande de démarrage"
    fi
fi

echo ""

# 4. Forcer la réactivation de N8N
echo "4️⃣ Réactivation de N8N..."
echo "-------------------------"

# Vérifier le statut actuel
CURRENT_STATUS=$(pm2 list | grep -i n8n | awk '{print $NF}' || echo "")
echo "   📋 Statut actuel: $CURRENT_STATUS"

if [ "$CURRENT_STATUS" = "disabled" ]; then
    echo "   📝 N8N est 'disabled', réactivation..."
    
    # Méthode 1: Redémarrer et sauvegarder
    pm2 restart n8n
    sleep 2
    pm2 save --force
    
    # Méthode 2: Supprimer et recréer
    if pm2 list | grep -i n8n | grep -q "disabled"; then
        echo "   📝 Tentative de recréation..."
        N8N_INFO=$(pm2 jlist | jq -r '.[] | select(.name=="n8n")' 2>/dev/null || echo "")
        if [ -n "$N8N_INFO" ]; then
            # Sauvegarder la config
            pm2 delete n8n
            sleep 1
            # Recréer avec la même config
            pm2 start n8n
            pm2 save
        fi
    fi
    
    echo "   ✅ N8N réactivé"
else
    echo "   ✅ N8N est déjà 'enabled'"
fi

echo ""

# 5. Vérification finale
echo "5️⃣ Vérification finale..."
echo "-------------------------"
echo ""
echo "📋 Statut PM2:"
pm2 list | grep -i n8n

echo ""
FINAL_STATUS=$(pm2 list | grep -i n8n | awk '{print $NF}' || echo "")
if [ "$FINAL_STATUS" = "enabled" ]; then
    echo "✅ N8N est maintenant 'enabled'"
    echo "   💡 N8N redémarrera automatiquement au redémarrage du serveur"
else
    echo "⚠️  N8N est toujours 'disabled'"
    echo ""
    echo "💡 Solutions alternatives:"
    echo "   1. Vérifiez les logs: pm2 logs n8n"
    echo "   2. Redémarrez manuellement: pm2 restart n8n && pm2 save"
    echo "   3. Vérifiez le service systemd: systemctl status pm2-root"
fi

echo ""
echo "==================================================="
echo "✅ Configuration terminée"
echo ""



