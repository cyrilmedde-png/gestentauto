-- Script pour nettoyer les doublons d'entreprises
-- ⚠️ ATTENTION : Ce script supprime les entreprises en double
-- Conserve uniquement la première entreprise créée avec son utilisateur associé
-- À exécuter dans Supabase SQL Editor avec précaution

-- ÉTAPE 1 : Identifier les entreprises en double pour "Groupe Mclem"
-- Vérifiez d'abord les résultats avant de continuer
SELECT 
  id,
  name,
  email,
  created_at,
  (SELECT COUNT(*) FROM users WHERE company_id = companies.id) as user_count
FROM companies
WHERE name LIKE '%Mclem%' OR name LIKE '%Groupe%'
ORDER BY created_at ASC;

-- ÉTAPE 2 : Identifier l'entreprise à conserver (celle avec le premier created_at)
-- Remplacez 'VOTRE_COMPANY_ID_A_CONSERVER' par l'ID de l'entreprise à garder
DO $$
DECLARE
  company_to_keep UUID;
  company_to_delete UUID;
BEGIN
  -- Identifier l'entreprise la plus ancienne pour "Groupe Mclem"
  SELECT id INTO company_to_keep
  FROM companies
  WHERE name LIKE '%Mclem%' OR name LIKE '%Groupe%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Si on trouve une entreprise, on garde celle-ci et on supprime les autres
  IF company_to_keep IS NOT NULL THEN
    -- Supprimer les utilisateurs des entreprises en double (sauf celle à garder)
    DELETE FROM users
    WHERE company_id IN (
      SELECT id FROM companies
      WHERE (name LIKE '%Mclem%' OR name LIKE '%Groupe%')
      AND id != company_to_keep
    );

    -- Supprimer les entreprises en double (sauf celle à garder)
    DELETE FROM companies
    WHERE (name LIKE '%Mclem%' OR name LIKE '%Groupe%')
    AND id != company_to_keep;

    RAISE NOTICE 'Entreprise conservée: %', company_to_keep;
    RAISE NOTICE 'Entreprises en double supprimées';
  ELSE
    RAISE NOTICE 'Aucune entreprise "Mclem" trouvée';
  END IF;
END $$;

-- ÉTAPE 3 : Vérifier le résultat
SELECT 
  id,
  name,
  email,
  created_at,
  (SELECT COUNT(*) FROM users WHERE company_id = companies.id) as user_count
FROM companies
ORDER BY created_at DESC;




