# Instructions Finales - Créer votre compte admin

## 📋 Étapes à suivre :

### 1. Vérifier l'état actuel (Optionnel mais recommandé)

1. Ouvrez **Supabase Dashboard > SQL Editor**
2. Exécutez le script `database/verifier_compte.sql`
3. Regardez les résultats pour voir ce qui manque

### 2. Exécuter le script de création

1. Dans **Supabase Dashboard > SQL Editor**
2. Ouvrez le fichier **`database/create_admin_user_FINAL.sql`**
3. **Copiez tout le contenu**
4. **Collez dans l'éditeur SQL** de Supabase
5. **Exécutez le script** (bouton "Run" ou F5)

### 3. Vérifier les résultats

À la fin du script, vous verrez :
- Des messages de succès dans les "NOTICES"
- Une table de vérification qui confirme que tout est créé

Si vous voyez **"✅ TOUT EST OK"** : C'est parfait !

### 4. Se connecter

1. Allez sur `http://localhost:3000/auth/login`
2. Entrez :
   - **Email** : `groupemclem@gmail.com`
   - **Mot de passe** : celui que vous avez défini dans Supabase
3. Vous devriez être connecté et redirigé vers le dashboard

---

## 🔍 Si ça ne fonctionne pas

### Vérifier dans Supabase :

1. **Authentication > Users** : Votre utilisateur doit être là
2. **Table Editor > users** : Vous devez voir votre entrée
3. **Table Editor > companies** : L'entreprise "Groupe Mclem" doit exister
4. **Table Editor > roles** : Le rôle "Administrateur" doit exister

### Si l'utilisateur n'existe pas dans la table `users` :

C'est normal si vous venez de créer le compte dans Supabase Auth. Exécutez simplement le script `create_admin_user_FINAL.sql` et cela créera tout.

### Erreurs courantes :

- **"duplicate key"** : Normal, cela signifie que ça existe déjà, le script gère cela
- **"foreign key violation"** : Cela signifie que l'UUID ne correspond pas, vérifiez que vous utilisez le bon UUID

---

## ✅ Après connexion réussie

Vous aurez :
- Accès complet au dashboard
- Tous les droits administrateur
- Pouvoir gérer votre entreprise "Groupe Mclem"
- Accès à tous les modules




