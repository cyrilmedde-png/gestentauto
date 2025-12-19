# 🔗 URL Supabase - Quelle URL utiliser ?

## ✅ URL Correcte

L'URL Supabase doit être l'**URL de l'API** de votre projet, pas l'URL du dashboard.

**Format** : `https://[votre-project-ref].supabase.co`

Pour votre projet, l'URL est :
```
https://lkzfmialjaryobminfbg.supabase.co
```

## 📍 Où trouver cette URL dans Supabase

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Sélectionnez votre projet
3. Allez dans **Settings** (⚙️) > **API**
4. Dans la section **Project URL**, vous verrez l'URL de l'API
5. C'est cette URL qu'il faut utiliser (pas l'URL du dashboard)

## ⚠️ Différence importante

- ❌ **URL Dashboard** : `https://supabase.com/dashboard/project/...` (ne pas utiliser)
- ✅ **URL API** : `https://lkzfmialjaryobminfbg.supabase.co` (à utiliser)

## 🔍 Comment identifier votre URL

Votre URL API contient toujours :
- Le format : `https://[ref].supabase.co`
- Le "ref" est visible dans vos clés API (dans votre cas : `lkzfmialjaryobminfbg`)

## ✅ Vérification

Une fois l'URL correcte dans votre fichier `.env`, vous pouvez tester avec :

```bash
curl https://lkzfmialjaryobminfbg.supabase.co/rest/v1/
```

Si vous obtenez une réponse (même une erreur d'authentification), c'est que l'URL est correcte !

