-- =====================================================
-- MISE À JOUR DES IDs STRIPE
-- =====================================================
-- Mettre à jour les IDs Stripe pour les 3 formules
-- =====================================================

-- Formule Starter (29€/mois)
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_ThiLvm7eWDKwVD',
  stripe_price_id = 'price_1SkIubCYJi35hFxKwlVl0YY7',
  updated_at = NOW()
WHERE name = 'starter';

-- Formule Business (79€/mois)
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_ThiMItJdm7KDs6',
  stripe_price_id = 'price_1SkIviCYJi35hFxKYDLAkxqV',
  updated_at = NOW()
WHERE name = 'business';

-- Formule Enterprise (199€/mois)
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_ThiOnl8G2MjB5u',
  stripe_price_id = 'price_1SkIxlCYJi35hFxKy19UdQw7',
  updated_at = NOW()
WHERE name = 'enterprise';

-- Vérification
SELECT 
  name,
  display_name,
  price_monthly,
  stripe_product_id,
  stripe_price_id,
  is_active
FROM subscription_plans
ORDER BY sort_order;

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '✅ IDs Stripe mis à jour avec succès !';
  RAISE NOTICE '📊 Starter: prod_ThiLvm7eWDKwVD';
  RAISE NOTICE '📊 Business: prod_ThiMItJdm7KDs6';
  RAISE NOTICE '📊 Enterprise: prod_ThiOnl8G2MjB5u';
END $$;

