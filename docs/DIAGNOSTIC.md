# 🔍 Diagnostic des Problèmes

## Page de Diagnostic

Une page de diagnostic a été créée pour vérifier la configuration :

**URL :** `https://votre-app.vercel.app/debug`

Cette page affiche :
- ✅ Les variables d'environnement configurées
- ❌ Les variables manquantes
- ⚠️ Les informations système

## Comment Utiliser

1. Ouvrez `https://votre-app.vercel.app/debug` dans votre navigateur
2. Vérifiez quelles variables sont configurées
3. Si des variables sont manquantes, configurez-les dans Vercel Dashboard

## Problèmes Courants

### Les variables ne s'affichent pas

**Cause :** Les variables ne sont pas correctement configurées dans Vercel.

**Solution :**
1. Vercel Dashboard → Settings → Environment Variables
2. Vérifiez que les variables sont bien ajoutées
3. Vérifiez qu'elles sont actives pour "Production"
4. Redéployez l'application

### Les variables s'affichent mais l'app ne fonctionne pas

**Cause :** Les variables peuvent être mal formatées ou incorrectes.

**Solution :**
1. Vérifiez que les valeurs sont correctes (pas d'espaces, pas de guillemets)
2. Vérifiez que les clés Supabase sont bien les bonnes
3. Vérifiez dans Supabase Dashboard que le projet est actif

