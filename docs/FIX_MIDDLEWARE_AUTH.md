# 🔧 Correction du middleware d'authentification

## Problème identifié

Le middleware `verifyPlatformUser` nécessitait que l'ID utilisateur soit passé dans les headers (`X-User-Id`) ou dans le body de la requête. Cependant, les appels API depuis le frontend (GET `/api/platform/leads`) ne passent pas cet ID, ce qui causait une erreur 500.

## Solution appliquée

Le middleware a été modifié pour **récupérer automatiquement l'utilisateur depuis les cookies de session Supabase** si l'ID n'est pas fourni explicitement.

### Ordre de vérification :

1. **ID dans le paramètre `userId`** (si fourni explicitement)
2. **ID dans le header `X-User-Id`** (si fourni par le client)
3. **ID dans le body `userId`** (pour POST/PATCH)
4. **ID depuis les cookies de session Supabase** (nouveau - si aucun des précédents n'est trouvé)

## Code modifié

**Fichier** : `lib/middleware/platform-auth.ts`

```typescript
// Si aucun ID n'est fourni, essayer de récupérer depuis les cookies (session Supabase)
if (!finalUserId) {
  try {
    const supabase = await createServerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        isPlatform: false,
        error: 'Not authenticated. Please log in.',
      }
    }
    
    finalUserId = user.id
  } catch (sessionError) {
    return {
      isPlatform: false,
      error: 'Could not retrieve user session. Please provide X-User-Id header or log in.',
    }
  }
}
```

## Avantages

- ✅ **Plus besoin de passer l'ID utilisateur dans les headers** depuis le frontend
- ✅ **Utilise la session Supabase** déjà établie lors de la connexion
- ✅ **Rétrocompatible** : fonctionne toujours avec les headers si fournis
- ✅ **Plus sécurisé** : utilise les cookies de session plutôt que des headers personnalisés

## Déploiement

Après avoir poussé ce code sur GitHub, déployer sur le serveur :

```bash
cd /var/www/talosprime
git pull origin main
npm install
npm run build
pm2 restart all
```

## Vérification

Après le déploiement, tester :

1. Se connecter à l'application
2. Aller sur `/platform/leads`
3. L'erreur 500 devrait disparaître
4. Les leads devraient s'afficher (ou liste vide si aucun lead)

## Si ça ne fonctionne toujours pas

Vérifier les logs serveur pour voir l'erreur exacte :

```bash
pm2 logs talosprime --err --lines 100
```

Les erreurs possibles :
- **"Not authenticated"** → Vérifier que la session Supabase est bien établie
- **"User not found"** → Vérifier que l'utilisateur existe dans la table `users`
- **"Platform not configured"** → Vérifier que `platform_company_id` est défini dans les settings









