-- Script pour mettre à jour ou vérifier le platform_company_id dans settings
-- Company ID de la plateforme : 17a58a60-f13a-4a22-998f-f04f20089cbc

DO $$
DECLARE
  target_company_id UUID := '17a58a60-f13a-4a22-998f-f04f20089cbc';
  current_platform_id UUID;
  rec RECORD;
BEGIN
  -- Vérifier le platform_company_id actuel
  SELECT (value#>>'{}')::UUID INTO current_platform_id
  FROM settings
  WHERE key = 'platform_company_id'
  LIMIT 1;

  -- Afficher l'état actuel
  RAISE NOTICE 'Platform company ID actuel: %', current_platform_id;
  RAISE NOTICE 'Platform company ID cible: %', target_company_id;

  -- Si le platform_company_id n'existe pas ou est différent, le mettre à jour
  IF current_platform_id IS NULL OR current_platform_id != target_company_id THEN
    -- Mettre à jour ou insérer le platform_company_id
    INSERT INTO settings (key, value, description)
    VALUES (
      'platform_company_id',
      to_jsonb(target_company_id::text),
      'UUID de la company plateforme (utilisé pour identifier les utilisateurs plateforme)'
    )
    ON CONFLICT (key) 
    DO UPDATE SET
      value = to_jsonb(target_company_id::text),
      updated_at = NOW();

    RAISE NOTICE '✅ platform_company_id mis à jour vers: %', target_company_id;
  ELSE
    RAISE NOTICE '✅ platform_company_id est déjà correct: %', current_platform_id;
  END IF;

  -- Vérifier les utilisateurs avec ce company_id
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisateurs avec ce company_id:';
  FOR rec IN 
    SELECT id, email, company_id, created_at
    FROM users
    WHERE company_id = target_company_id
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '  - User: % (email: %, created: %)', rec.id, rec.email, rec.created_at;
  END LOOP;

  -- Vérifier dans platform_n8n_access
  RAISE NOTICE '';
  RAISE NOTICE 'Accès N8N pour ce company_id:';
  FOR rec IN 
    SELECT user_id, is_platform_admin, has_n8n_access, access_level
    FROM platform_n8n_access
    WHERE company_id = target_company_id
  LOOP
    RAISE NOTICE '  - User: %, Admin: %, Access: %, Level: %', 
      rec.user_id, rec.is_platform_admin, rec.has_n8n_access, rec.access_level;
  END LOOP;

END;
$$;

