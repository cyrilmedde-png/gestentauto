# 🔍 Debug de la session Supabase

## Problème
La session se perd après chaque rafraîchissement de page, forçant l'utilisateur à se reconnecter.

## Vérifications à faire

### 1. Vérifier localStorage dans le navigateur

Ouvrez les DevTools (F12) et allez dans l'onglet **Application** (Chrome) ou **Storage** (Firefox) :

1. Dans le panneau de gauche, cherchez **Local Storage**
2. Cliquez sur `http://localhost:4000`
3. Cherchez les clés qui commencent par `sb-` (Supabase)

Vous devriez voir quelque chose comme :
- `sb-{project-ref}-auth-token`
- `sb-{project-ref}-auth-token-code-verifier` (si présent)

### 2. Vérifier si la session existe

Dans la console du navigateur, tapez :

```javascript
// Vérifier localStorage
Object.keys(localStorage).filter(key => key.includes('auth'))

// Vérifier la session Supabase
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('Error:', error)
```

### 3. Vérifier les erreurs dans la console

Regardez s'il y a des erreurs dans la console qui pourraient indiquer :
- Des problèmes de CORS
- Des erreurs de réseau
- Des erreurs d'authentification

### 4. Tester manuellement la restauration de session

Dans la console du navigateur :

```javascript
// 1. Vérifier la session actuelle
const { data: { session } } = await supabase.auth.getSession()
console.log('Session actuelle:', session)

// 2. Si pas de session, vérifier localStorage
const authToken = localStorage.getItem('sb-lkzfmialjaryobminfbg-auth-token')
console.log('Token dans localStorage:', authToken)

// 3. Essayer de restaurer manuellement
if (authToken) {
  try {
    const parsed = JSON.parse(authToken)
    console.log('Token parsé:', parsed)
  } catch (e) {
    console.error('Erreur parsing token:', e)
  }
}
```

## Solutions possibles

### Solution 1: Vérifier que le client Supabase est bien initialisé

Le client Supabase doit être créé une seule fois et réutilisé. Le code utilise maintenant un pattern singleton.

### Solution 2: Vérifier les paramètres de Supabase

Dans le dashboard Supabase :
1. Allez dans **Authentication** > **URL Configuration**
2. Vérifiez que les URLs de redirection sont correctement configurées
3. Vérifiez que `http://localhost:4000` est dans la liste des URLs autorisées

### Solution 3: Vider complètement localStorage

Si localStorage est corrompu :

```javascript
// Dans la console du navigateur
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    localStorage.removeItem(key)
  }
})
```

Puis reconnectez-vous.

### Solution 4: Vérifier les cookies

Supabase peut aussi utiliser des cookies pour certaines configurations. Vérifiez dans les DevTools > Application > Cookies si des cookies Supabase sont présents.

## Logs à activer

Ajoutez temporairement dans `src/lib/supabase.ts` :

```typescript
if (typeof window !== 'undefined') {
  console.log('Supabase client created, localStorage available:', !!window.localStorage)
}
```

Et dans `AuthProvider.tsx`, ajoutez :

```typescript
console.log('Checking session, localStorage keys:', Object.keys(localStorage).filter(k => k.includes('auth')))
```

