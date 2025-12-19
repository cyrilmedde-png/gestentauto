-- Politique RLS pour le développement local
-- ⚠️ À utiliser UNIQUEMENT en développement, jamais en production !

-- Permettre à un utilisateur de voir ses propres données
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Permettre à un utilisateur de modifier ses propres données
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Permettre l'insertion pour les nouveaux utilisateurs
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Si vous voulez permettre tout (ATTENTION: pour développement seulement!)
-- DÉCOMMENTEZ les lignes ci-dessous et COMMENTEZ les politiques ci-dessus
-- ⚠️ NE JAMAIS FAIRE ÇA EN PRODUCTION !

-- DROP POLICY IF EXISTS "Users can view own data" ON users;
-- DROP POLICY IF EXISTS "Users can update own data" ON users;
-- DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- CREATE POLICY "dev_all_access" ON users FOR ALL
-- USING (true)
-- WITH CHECK (true);

