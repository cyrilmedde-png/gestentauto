# Différence de Version N8N

## Explication

Il est **normal** d'avoir une différence entre :
- `n8n --version` (2.1.4) : Version de l'outil CLI N8N installé globalement
- Panel N8N (2.0.3) : Version de l'instance N8N en cours d'exécution sur le serveur

## Pourquoi cette différence ?

1. **CLI N8N** (`n8n --version`) :
   - Installé globalement avec `npm install -g n8n`
   - C'est la version de l'outil en ligne de commande
   - Peut être mise à jour indépendamment de l'instance en cours d'exécution

2. **Instance N8N** (panel) :
   - Version de N8N démarrée avec PM2
   - Dépend de la version installée dans `/var/n8n/`
   - C'est la version qui s'exécute réellement

## Solution : Mettre à jour N8N

Pour synchroniser les versions, vous pouvez mettre à jour l'instance N8N :

```bash
# Se connecter en tant qu'utilisateur n8n
sudo -u n8n bash

# Aller dans le répertoire N8N
cd /var/n8n

# Mettre à jour N8N
npm update n8n

# Redémarrer avec PM2
pm2 restart n8n

# Vérifier la version
n8n --version
# Dans le panel : Aller dans Settings > Version
```

**Note** : La version 2.0.3 est fonctionnelle. La mise à jour vers 2.1.4 est optionnelle mais recommandée pour bénéficier des dernières corrections et fonctionnalités.

