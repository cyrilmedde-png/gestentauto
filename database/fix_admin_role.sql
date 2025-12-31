-- =====================================================
-- VÉRIFIER ET CORRIGER LE RÔLE ADMINISTRATEUR
-- =====================================================

-- 1️⃣ VÉRIFIER VOTRE COMPTE ACTUEL
-- =====================================================

-- Voir votre email et rôle actuel
SELECT 
  u.id,
  u.email,
  r.name AS role_actuel,
  u.created_at
FROM auth.users au
JOIN public.users u ON au.id = u.id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE au.email = 'cyrilmedde@gmail.com';  -- Remplacer par votre email si différent

-- 2️⃣ VÉRIFIER QUE LE RÔLE EXISTE
-- =====================================================

-- Voir tous les rôles disponibles
SELECT * FROM public.roles ORDER BY name;

-- Si le rôle "Administrateur Plateforme" n'existe pas, le créer:
INSERT INTO public.roles (id, name, description, permissions, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrateur Plateforme',
  'Administrateur avec accès complet à la plateforme',
  '{"all": true}'::JSONB,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 3️⃣ METTRE À JOUR VOTRE RÔLE
-- =====================================================

-- Option A : Mettre à jour par email
UPDATE public.users
SET role_id = (
  SELECT id FROM public.roles WHERE name = 'Administrateur Plateforme'
)
WHERE email = 'cyrilmedde@gmail.com';  -- Remplacer par votre email

-- Option B : Mettre à jour par ID utilisateur (si vous connaissez votre ID)
-- UPDATE public.users
-- SET role_id = (SELECT id FROM public.roles WHERE name = 'Administrateur Plateforme')
-- WHERE id = 'VOTRE_USER_ID_ICI';

-- 4️⃣ VÉRIFIER LA CORRECTION
-- =====================================================

-- Vérifier que le rôle est bien mis à jour
SELECT 
  u.email,
  r.name AS role,
  r.permissions,
  u.updated_at
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'cyrilmedde@gmail.com';  -- Remplacer par votre email

-- Résultat attendu:
-- role: "Administrateur Plateforme"

-- 5️⃣ SI ÇA NE MARCHE TOUJOURS PAS
-- =====================================================

-- Vérifier la structure de la table users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- Vérifier s'il y a des triggers ou RLS qui bloquent
SELECT * FROM pg_policies WHERE tablename = 'users';

-- =====================================================
-- APRÈS EXÉCUTION DE CE SCRIPT
-- =====================================================

-- 1. Déconnectez-vous de l'application
-- 2. Reconnectez-vous
-- 3. Retournez sur /platform/plans
-- 4. L'erreur devrait avoir disparu ✅

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

-- ⚠️ Ce script donne des droits ADMIN COMPLETS
-- 🔒 Ne donnez ce rôle qu'aux personnes de confiance
-- 📧 Remplacez l'email par le vôtre si différent
-- 🔄 Reconnexion obligatoire après modification

-- =====================================================

