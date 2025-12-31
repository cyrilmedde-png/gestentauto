-- =====================================================
-- CORRIGER LE RÔLE ADMIN - EXÉCUTION IMMÉDIATE
-- =====================================================
-- ⚠️ Remplacez 'cyrilmedde@gmail.com' par votre email si différent
-- =====================================================

-- ÉTAPE 1 : Voir votre rôle actuel
SELECT 
  u.email,
  COALESCE(r.name, 'AUCUN RÔLE') AS role_actuel,
  u.role_id
FROM auth.users au
JOIN public.users u ON au.id = u.id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE au.email = 'cyrilmedde@gmail.com';

-- ÉTAPE 2 : Créer le rôle "Administrateur Plateforme" s'il n'existe pas
INSERT INTO public.roles (id, name, description, permissions, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrateur Plateforme',
  'Administrateur avec accès complet',
  '{"all": true}'::JSONB,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- ÉTAPE 3 : Vous donner le rôle d'administrateur
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'Administrateur Plateforme' LIMIT 1)
WHERE id IN (
  SELECT u.id 
  FROM auth.users au 
  JOIN public.users u ON au.id = u.id 
  WHERE au.email = 'cyrilmedde@gmail.com'
);

-- ÉTAPE 4 : Vérifier que c'est bien appliqué
SELECT 
  u.email,
  r.name AS role_corrige,
  r.permissions
FROM auth.users au
JOIN public.users u ON au.id = u.id
JOIN public.roles r ON u.role_id = r.id
WHERE au.email = 'cyrilmedde@gmail.com';

-- =====================================================
-- RÉSULTAT ATTENDU :
-- role_corrige: "Administrateur Plateforme"
-- permissions: {"all": true}
-- =====================================================

-- APRÈS :
-- 1. Déconnectez-vous de l'application
-- 2. Reconnectez-vous
-- 3. Videz le cache (Cmd+Shift+R)
-- 4. Retournez sur /platform/plans
-- =====================================================

