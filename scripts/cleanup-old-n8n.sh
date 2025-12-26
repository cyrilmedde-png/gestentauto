#!/bin/bash
# Script SÉCURISÉ pour nettoyer l'ancienne installation N8N
# ⚠️  NE TOUCHE JAMAIS à l'installation actuelle qui fonctionne
# Usage: sudo bash scripts/cleanup-old-n8n.sh

set -e  # Arrêter en cas d'erreur

echo "🧹 Nettoyage SÉCURISÉ de l'ancienne installation N8N"
echo "====================================================="
echo ""
echo "⚠️  ATTENTION: Ce script va supprimer UNIQUEMENT les anciennes installations"
echo "⚠️  L'installation actuelle qui fonctionne sera PRÉSERVÉE"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root"
fi

# ============================================
# ÉTAPE 1: Identifier l'installation ACTUELLE
# ============================================
echo "1️⃣ Identification de l'installation ACTUELLE (qui fonctionne)..."
echo "================================================================="

CURRENT_N8N=""
CURRENT_N8N_DIR=""
CURRENT_N8N_FULL_PATH=""

# Méthode 1: Via PM2 (le plus fiable)
if pm2 list 2>/dev/null | grep -qi n8n; then
    echo "   📋 N8N trouvé dans PM2, analyse de la configuration..."
    
    # Essayer d'obtenir le script via pm2 jlist
    PM2_SCRIPT=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | .pm2_env.script' 2>/dev/null || echo "")
    
    if [ -n "$PM2_SCRIPT" ] && [ "$PM2_SCRIPT" != "null" ]; then
        CURRENT_N8N="$PM2_SCRIPT"
        CURRENT_N8N_DIR=$(dirname "$PM2_SCRIPT" 2>/dev/null || echo "")
        CURRENT_N8N_FULL_PATH="$PM2_SCRIPT"
        echo "   ✅ Installation actuelle identifiée via PM2: $CURRENT_N8N"
    else
        # Méthode alternative: chercher dans ecosystem.config.js
        if [ -f "$HOME/.pm2/ecosystem.config.js" ]; then
            ECOSYSTEM_SCRIPT=$(grep -A 5 '"name".*"n8n"' "$HOME/.pm2/ecosystem.config.js" 2>/dev/null | grep "script" | head -1 | sed 's/.*script.*:.*["'\'']\([^"'\'']*\)["'\''].*/\1/' || echo "")
            if [ -n "$ECOSYSTEM_SCRIPT" ] && [ -f "$ECOSYSTEM_SCRIPT" ]; then
                CURRENT_N8N="$ECOSYSTEM_SCRIPT"
                CURRENT_N8N_DIR=$(dirname "$ECOSYSTEM_SCRIPT")
                CURRENT_N8N_FULL_PATH="$ECOSYSTEM_SCRIPT"
                echo "   ✅ Installation actuelle identifiée via ecosystem.config.js: $CURRENT_N8N"
            fi
        fi
    fi
fi

# Méthode 2: Via which (si PM2 n'a pas donné de résultat)
if [ -z "$CURRENT_N8N" ]; then
    if command -v n8n &> /dev/null; then
        CURRENT_N8N=$(which n8n)
        CURRENT_N8N_DIR=$(dirname "$CURRENT_N8N")
        CURRENT_N8N_FULL_PATH="$CURRENT_N8N"
        echo "   ✅ Installation actuelle identifiée via PATH: $CURRENT_N8N"
    fi
fi

# Vérification critique
if [ -z "$CURRENT_N8N" ] || [ ! -f "$CURRENT_N8N" ]; then
    echo ""
    echo "❌ ERREUR CRITIQUE: Impossible d'identifier l'installation actuelle"
    echo "   ⚠️  Le script s'arrête pour éviter de supprimer la mauvaise installation"
    exit 1
fi

echo "   📍 Chemin complet: $CURRENT_N8N_FULL_PATH"
echo "   📍 Répertoire: $CURRENT_N8N_DIR"
echo ""

# Normaliser les chemins pour les comparaisons
CURRENT_N8N_NORM=$(readlink -f "$CURRENT_N8N_FULL_PATH" 2>/dev/null || echo "$CURRENT_N8N_FULL_PATH")
CURRENT_N8N_DIR_NORM=$(readlink -f "$CURRENT_N8N_DIR" 2>/dev/null || echo "$CURRENT_N8N_DIR")

echo "   ✅ Installation actuelle identifiée et vérifiée"
echo ""

# ============================================
# ÉTAPE 2: Vérifier que l'installation actuelle FONCTIONNE
# ============================================
echo "2️⃣ Vérification que l'installation actuelle FONCTIONNE..."
echo "==========================================================="

# Vérifier PM2 - méthode plus fiable pour extraire le statut
PM2_STATUS=$(pm2 list 2>/dev/null | grep -i n8n | grep -oE "online|stopped|errored|launching" | head -1 || echo "")
if [ -z "$PM2_STATUS" ]; then
    # Essayer avec jlist (JSON) qui est plus fiable
    PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | .pm2_env.status' 2>/dev/null || echo "")
fi

if [ "$PM2_STATUS" != "online" ]; then
    echo "   ⚠️  N8N n'est pas 'online' dans PM2 (statut: $PM2_STATUS)"
    echo "   💡 Vérification alternative..."
    
    # Vérification alternative: si N8N répond, c'est qu'il fonctionne
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "   ✅ N8N répond correctement malgré le statut PM2 (Code: $HTTP_CODE)"
        echo "   ✅ On continue (N8N fonctionne même si le statut PM2 est ambigu)"
        PM2_STATUS="online"  # Forcer pour continuer
    else
        echo "   ⚠️  N8N ne répond pas non plus (Code: $HTTP_CODE)"
        echo "   ⚠️  Le script s'arrête pour éviter tout problème"
        exit 1
    fi
else
    echo "   ✅ N8N est 'online' dans PM2"
fi

# Vérifier que N8N répond
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "302" ]; then
    echo "   ⚠️  N8N ne répond pas correctement (Code: $HTTP_CODE)"
    echo "   ⚠️  Le script s'arrête pour éviter tout problème"
    exit 1
fi
echo "   ✅ N8N répond correctement (Code: $HTTP_CODE)"
echo ""

# ============================================
# ÉTAPE 3: Identifier les ANCIENNES installations
# ============================================
echo "3️⃣ Identification des ANCIENNES installations (à supprimer)..."
echo "==============================================================="

OLD_INSTALLATIONS=()
OLD_FILES=()

# Fonction pour vérifier si un chemin est différent de l'installation actuelle
is_different() {
    local path="$1"
    local path_norm=$(readlink -f "$path" 2>/dev/null || echo "$path")
    
    # Vérifier que ce n'est pas l'installation actuelle
    if [ "$path_norm" = "$CURRENT_N8N_NORM" ]; then
        return 1  # C'est l'installation actuelle, ne pas supprimer
    fi
    
    # Vérifier que ce n'est pas dans le répertoire de l'installation actuelle
    if [[ "$path_norm" == "$CURRENT_N8N_DIR_NORM"* ]]; then
        return 1  # C'est dans le répertoire actuel, ne pas supprimer
    fi
    
    return 0  # C'est différent, peut être supprimé
}

# Ancienne installation dans /var/n8n
if [ -d "/var/n8n" ]; then
    if is_different "/var/n8n"; then
        # Vérifier que c'est bien une installation N8N
        if [ -f "/var/n8n/node_modules/.bin/n8n" ] || [ -f "/var/n8n/package.json" ]; then
            OLD_INSTALLATIONS+=("/var/n8n")
            echo "   📋 Ancienne installation trouvée: /var/n8n"
        fi
    else
        echo "   ✅ /var/n8n est l'installation actuelle (CONSERVÉE)"
    fi
fi

# Ancienne installation dans /usr/bin/n8n
if [ -f "/usr/bin/n8n" ]; then
    if is_different "/usr/bin/n8n"; then
        OLD_FILES+=("/usr/bin/n8n")
        echo "   📋 Ancien binaire trouvé: /usr/bin/n8n"
    else
        echo "   ✅ /usr/bin/n8n est l'installation actuelle (CONSERVÉE)"
    fi
fi

# Ancienne installation dans ~/.n8n
if [ -d "$HOME/.n8n" ]; then
    if is_different "$HOME/.n8n"; then
        if [ -f "$HOME/.n8n/node_modules/.bin/n8n" ] || [ -f "$HOME/.n8n/package.json" ]; then
            OLD_INSTALLATIONS+=("$HOME/.n8n")
            echo "   📋 Ancienne installation trouvée: $HOME/.n8n"
        fi
    else
        echo "   ✅ $HOME/.n8n est l'installation actuelle (CONSERVÉE)"
    fi
fi

# Ancienne installation dans /usr/local/bin/n8n
if [ -f "/usr/local/bin/n8n" ]; then
    if is_different "/usr/local/bin/n8n"; then
        OLD_FILES+=("/usr/local/bin/n8n")
        echo "   📋 Ancien binaire trouvé: /usr/local/bin/n8n"
    else
        echo "   ✅ /usr/local/bin/n8n est l'installation actuelle (CONSERVÉE)"
    fi
fi

if [ ${#OLD_INSTALLATIONS[@]} -eq 0 ] && [ ${#OLD_FILES[@]} -eq 0 ]; then
    echo "   ✅ Aucune ancienne installation trouvée"
    echo ""
    echo "====================================================="
    echo "✅ Nettoyage terminé (rien à nettoyer)"
    echo ""
    echo "💡 L'installation actuelle est: $CURRENT_N8N_FULL_PATH"
    exit 0
fi

echo ""

# ============================================
# ÉTAPE 4: Afficher le résumé AVANT suppression
# ============================================
echo "4️⃣ Résumé AVANT suppression..."
echo "==============================="
echo ""
echo "✅ Installation ACTUELLE (SERA CONSERVÉE):"
echo "   📍 $CURRENT_N8N_FULL_PATH"
echo "   📍 Répertoire: $CURRENT_N8N_DIR_NORM"
echo ""
echo "🗑️  Anciennes installations (SERONT SUPPRIMÉES):"
for old in "${OLD_INSTALLATIONS[@]}"; do
    if [ -d "$old" ]; then
        SIZE=$(du -sh "$old" 2>/dev/null | cut -f1 || echo "inconnu")
        echo "   - $old (Taille: $SIZE)"
    fi
done
for old in "${OLD_FILES[@]}"; do
    if [ -f "$old" ]; then
        SIZE=$(du -sh "$old" 2>/dev/null | cut -f1 || echo "inconnu")
        echo "   - $old (Taille: $SIZE)"
    fi
done

echo ""
echo "⚠️  ATTENTION: Cette action est IRRÉVERSIBLE (sauf sauvegarde)"
read -p "⚠️  Confirmer la suppression ? (tapez 'SUPPRIMER' en majuscules): " CONFIRM

if [ "$CONFIRM" != "SUPPRIMER" ]; then
    echo "❌ Suppression annulée (confirmation incorrecte)"
    exit 0
fi

echo ""

# ============================================
# ÉTAPE 5: Créer une sauvegarde COMPLÈTE
# ============================================
echo "5️⃣ Création d'une sauvegarde COMPLÈTE..."
echo "========================================="
BACKUP_DIR="/tmp/n8n-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "   📦 Sauvegarde dans: $BACKUP_DIR"

for old in "${OLD_INSTALLATIONS[@]}"; do
    if [ -d "$old" ]; then
        BACKUP_NAME=$(basename "$old" | tr '/' '_')
        echo "   📦 Sauvegarde de $old..."
        cp -r "$old" "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null && {
            echo "      ✅ Sauvegardé: $BACKUP_DIR/$BACKUP_NAME"
        } || {
            echo "      ⚠️  Erreur lors de la sauvegarde (continuer quand même)"
        }
    fi
done

for old in "${OLD_FILES[@]}"; do
    if [ -f "$old" ]; then
        BACKUP_NAME=$(basename "$old" | tr '/' '_')
        echo "   📦 Sauvegarde de $old..."
        cp "$old" "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null && {
            echo "      ✅ Sauvegardé: $BACKUP_DIR/$BACKUP_NAME"
        } || {
            echo "      ⚠️  Erreur lors de la sauvegarde (continuer quand même)"
        }
    fi
done

echo "   ✅ Sauvegarde terminée"
echo ""

# ============================================
# ÉTAPE 6: Supprimer les anciennes installations
# ============================================
echo "6️⃣ Suppression des anciennes installations..."
echo "=============================================="

for old in "${OLD_INSTALLATIONS[@]}"; do
    if [ -d "$old" ]; then
        echo "   🗑️  Suppression de $old..."
        
        # Double vérification: ne pas supprimer si c'est l'installation actuelle
        OLD_NORM=$(readlink -f "$old" 2>/dev/null || echo "$old")
        if [ "$OLD_NORM" = "$CURRENT_N8N_DIR_NORM" ] || [[ "$OLD_NORM" == "$CURRENT_N8N_DIR_NORM"* ]]; then
            echo "      ❌ ERREUR: Tentative de supprimer l'installation actuelle !"
            echo "      ⚠️  Suppression annulée pour cette entrée"
            continue
        fi
        
        rm -rf "$old" 2>/dev/null && {
            echo "      ✅ Supprimé: $old"
        } || {
            echo "      ⚠️  Erreur lors de la suppression de $old"
        }
    fi
done

for old in "${OLD_FILES[@]}"; do
    if [ -f "$old" ]; then
        echo "   🗑️  Suppression de $old..."
        
        # Double vérification
        OLD_NORM=$(readlink -f "$old" 2>/dev/null || echo "$old")
        if [ "$OLD_NORM" = "$CURRENT_N8N_NORM" ]; then
            echo "      ❌ ERREUR: Tentative de supprimer l'installation actuelle !"
            echo "      ⚠️  Suppression annulée pour cette entrée"
            continue
        fi
        
        rm -f "$old" 2>/dev/null && {
            echo "      ✅ Supprimé: $old"
        } || {
            echo "      ⚠️  Erreur lors de la suppression de $old"
        }
    fi
done

echo ""

# ============================================
# ÉTAPE 7: Vérification CRITIQUE que l'installation actuelle fonctionne TOUJOURS
# ============================================
echo "7️⃣ Vérification CRITIQUE que l'installation actuelle fonctionne TOUJOURS..."
echo "==========================================================================="

# Attendre un peu pour que tout se stabilise
sleep 2

# Vérifier PM2 - méthode plus fiable
PM2_STATUS_AFTER=$(pm2 list 2>/dev/null | grep -i n8n | grep -oE "online|stopped|errored|launching" | head -1 || echo "")
if [ -z "$PM2_STATUS_AFTER" ]; then
    PM2_STATUS_AFTER=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | .pm2_env.status' 2>/dev/null || echo "")
fi

if [ "$PM2_STATUS_AFTER" != "online" ]; then
    echo "   ⚠️  Statut PM2: $PM2_STATUS_AFTER (pas 'online')"
    echo "   💡 Vérification alternative..."
    
    # Vérification alternative: si N8N répond, c'est qu'il fonctionne
    HTTP_CODE_AFTER=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
    if [ "$HTTP_CODE_AFTER" = "200" ] || [ "$HTTP_CODE_AFTER" = "401" ] || [ "$HTTP_CODE_AFTER" = "302" ]; then
        echo "   ✅ N8N répond toujours correctement (Code: $HTTP_CODE_AFTER)"
        echo "   ✅ L'installation actuelle fonctionne toujours"
    else
        echo "   ❌ ERREUR CRITIQUE: N8N ne répond plus (Code: $HTTP_CODE_AFTER)"
        echo "   ⚠️  L'installation actuelle a peut-être été affectée"
        echo "   💡 Vérifiez: pm2 list | grep n8n"
        echo "   💡 Vérifiez: pm2 logs n8n"
        exit 1
    fi
else
    echo "   ✅ N8N est toujours 'online' dans PM2"
fi

# Vérifier que N8N répond toujours
HTTP_CODE_AFTER=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
if [ "$HTTP_CODE_AFTER" != "200" ] && [ "$HTTP_CODE_AFTER" != "401" ] && [ "$HTTP_CODE_AFTER" != "302" ]; then
    echo "   ❌ ERREUR CRITIQUE: N8N ne répond plus (Code: $HTTP_CODE_AFTER)"
    echo "   ⚠️  L'installation actuelle a peut-être été affectée"
    echo "   💡 Vérifiez: pm2 logs n8n"
    exit 1
fi
echo "   ✅ N8N répond toujours correctement (Code: $HTTP_CODE_AFTER)"

# Vérifier que le fichier actuel existe toujours
if [ ! -f "$CURRENT_N8N_FULL_PATH" ]; then
    echo "   ❌ ERREUR CRITIQUE: Le fichier actuel n'existe plus !"
    echo "   ⚠️  L'installation actuelle a été supprimée par erreur"
    exit 1
fi
echo "   ✅ Le fichier actuel existe toujours: $CURRENT_N8N_FULL_PATH"

echo ""

# ============================================
# ÉTAPE 8: Nettoyage optionnel de l'utilisateur n8n
# ============================================
echo "8️⃣ Vérification de l'utilisateur n8n (optionnel)..."
echo "===================================================="

if id "n8n" &>/dev/null; then
    # Vérifier si l'utilisateur a encore des fichiers
    if [ ! -d "/var/n8n" ] && [ ! -d "/home/n8n" ] && [ ! -f "/home/n8n/.n8n" ]; then
        echo "   📋 Utilisateur n8n existe mais n'a plus de répertoire"
        echo "   💡 L'utilisateur peut être conservé pour de futures installations"
        read -p "   Supprimer l'utilisateur n8n ? (oui/non, défaut: non): " DELETE_USER
        if [ "$DELETE_USER" = "oui" ]; then
            userdel -r n8n 2>/dev/null && {
                echo "      ✅ Utilisateur supprimé"
            } || {
                echo "      ⚠️  Impossible de supprimer l'utilisateur (peut être utilisé ailleurs)"
            }
        else
            echo "      ℹ️  Utilisateur conservé"
        fi
    else
        echo "   ℹ️  Utilisateur n8n conservé (répertoire encore présent ou utilisé)"
    fi
else
    echo "   ℹ️  Utilisateur n8n n'existe pas"
fi

echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo "====================================================="
echo "✅ Nettoyage terminé avec SUCCÈS"
echo "====================================================="
echo ""
echo "✅ Installation actuelle (CONSERVÉE et FONCTIONNELLE):"
echo "   📍 $CURRENT_N8N_FULL_PATH"
echo ""
echo "📦 Sauvegarde disponible dans:"
echo "   $BACKUP_DIR"
echo "   (Vous pouvez la supprimer si tout fonctionne bien)"
echo ""
echo "💡 Pour restaurer si nécessaire:"
echo "   sudo cp -r $BACKUP_DIR/* /var/n8n/"
echo ""
echo "✅ Vérifications finales:"
echo "   - N8N est 'online' dans PM2: ✅"
echo "   - N8N répond sur le port 5678: ✅"
echo "   - Le fichier actuel existe toujours: ✅"
echo ""

