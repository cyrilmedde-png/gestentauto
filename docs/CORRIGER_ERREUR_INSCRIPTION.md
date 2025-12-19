# 🔧 Correction erreur inscription - ID entreprise manquant

## ❌ Erreur rencontrée

```
null value in column "id" of relation "companies" violates not-null constraint
```

Cette erreur signifie que lors de la création d'une entreprise, l'ID n'était pas généré automatiquement.

## ✅ Solution appliquée

J'ai modifié la fonction `signUp` dans `src/modules/core/lib/auth.ts` pour :

1. **Générer un ID unique** avant d'insérer l'entreprise
2. **Inclure l'ID** dans l'insertion
3. **Améliorer la gestion d'erreurs** avec des messages plus clairs

## 📝 Changements

**Avant** :
```typescript
// L'ID n'était pas fourni, Supabase ne le générait pas automatiquement
.insert({
  name: companyName,
  country: 'FR',
  // ...
})
```

**Après** :
```typescript
// Génération d'un ID unique avant l'insertion
const companyId = generateId()

.insert({
  id: companyId,  // ✅ ID fourni explicitement
  name: companyName,
  country: 'FR',
  // ...
})
```

## 🚀 Test

Maintenant, vous pouvez :

1. **Actualiser la page** dans votre navigateur (F5)
2. **Remplir le formulaire** d'inscription
3. **Cliquer sur "Créer mon compte"**

L'inscription devrait maintenant fonctionner correctement !

## 📋 Vérification

Si l'inscription réussit :
- ✅ Vous serez redirigé vers `/dashboard`
- ✅ Votre entreprise sera créée dans la base de données
- ✅ Votre compte utilisateur sera créé et lié à l'entreprise

## 🆘 Si l'erreur persiste

Vérifiez que :
1. La base de données Supabase est accessible
2. Les tables `companies` et `users` existent (via `npm run db:push`)
3. Les permissions RLS permettent l'insertion (pour les nouveaux utilisateurs)

