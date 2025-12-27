# Créer un compte administrateur directement dans Supabase

## Méthode 1 : Via l'interface Supabase (Recommandé)

### Étape 1 : Créer l'utilisateur dans Supabase Auth

1. Allez dans **Supabase Dashboard > Authentication > Users**
2. Cliquez sur **"Add user"** ou **"Invite user"**
3. Entrez :
   - **Email** : `groupemclem@gmail.com`
   - **Password** : Créez un mot de passe
   - Désactivez "Auto Confirm User" si vous voulez confirmer manuellement, ou laissez activé
4. Cliquez sur **"Create user"**
5. **Copiez l'UUID de l'utilisateur créé** (visible dans la liste des utilisateurs)

### Étape 2 : Exécuter le script SQL

1. Allez dans **Supabase Dashboard > SQL Editor**
2. Ouvrez le fichier `database/create_admin_user_simple.sql`
3. Remplacez `'VOTRE_USER_ID_ICI'` par l'UUID que vous avez copié
4. Exécutez le script

### Étape 3 : Vérifier

Le script va :
- Créer l'entreprise "Groupe Mclem"
- Créer l'entrée dans la table `users`
- Créer un rôle "Administrateur" avec tous les droits
- Assigner ce rôle à votre utilisateur

Vous pouvez maintenant vous connecter avec `groupemclem@gmail.com` et votre mot de passe.

---

## Méthode 2 : Via l'application (si l'inscription fonctionne)

1. Allez sur `http://localhost:3000/auth/register`
2. Remplissez le formulaire avec vos informations
3. Après création, récupérez votre USER_ID :
   - Ouvrez la console du navigateur (F12)
   - Ou allez dans Supabase Dashboard > Authentication > Users
   - Copiez votre UUID

4. Exécutez ensuite le script SQL pour ajouter le rôle admin (voir ci-dessous)

---

## Ajouter le rôle admin à un utilisateur existant

Si vous avez déjà un compte mais sans le rôle admin :

```sql
-- 1. Trouver votre USER_ID et COMPANY_ID
SELECT id, company_id, email FROM users WHERE email = 'groupemclem@gmail.com';

-- 2. Créer le rôle admin pour votre entreprise
INSERT INTO roles (company_id, name, permissions)
VALUES (
  (SELECT company_id FROM users WHERE email = 'groupemclem@gmail.com'),
  'Administrateur',
  '{"all": true}'::jsonb
)
ON CONFLICT (company_id, name) DO UPDATE
SET permissions = EXCLUDED.permissions
RETURNING id;

-- 3. Assigner le rôle à votre utilisateur (remplacez <ROLE_ID> par l'ID retourné ci-dessus)
UPDATE users
SET role_id = '<ROLE_ID>'::uuid
WHERE email = 'groupemclem@gmail.com';
```

---

## Vérification des droits

Pour vérifier que tout est correct :

```sql
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  c.name as company_name,
  r.name as role_name,
  r.permissions
FROM users u
JOIN companies c ON u.company_id = c.id
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'groupemclem@gmail.com';
```







