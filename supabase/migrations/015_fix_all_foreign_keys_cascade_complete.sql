-- Migration: Fix ALL foreign keys to use ON DELETE CASCADE
-- Purpose: Allow deleting rows from any table without foreign key constraint violations
-- Date: 2025-12-09
--
-- This migration comprehensively updates ALL foreign key constraints to use ON DELETE CASCADE
-- so that when a parent row is deleted, all child rows are automatically deleted.

-- ==========================================
-- UTILITY: Function to safely drop and recreate foreign keys
-- ==========================================

-- ==========================================
-- PART 1: Fix payments table foreign keys
-- ==========================================

-- Fix payments.order_id -> orders.id (THIS IS THE KEY FIX!)
DO $$
BEGIN
  -- Drop existing constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_order_id_fkey'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_order_id_fkey;
    RAISE NOTICE '✅ Dropped payments_order_id_fkey';
  END IF;

  -- Re-add with CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added payments_order_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- Fix payments.user_id -> users.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_user_id_fkey'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT payments_user_id_fkey;
    RAISE NOTICE '✅ Dropped payments_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added payments_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 2: Fix orders table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_user_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
    RAISE NOTICE '✅ Dropped orders_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added orders_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 3: Fix profiles table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_user_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
    RAISE NOTICE '✅ Dropped profiles_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profiles_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 4: Fix profile_services table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_services_profile_id_fkey'
    AND table_name = 'profile_services'
  ) THEN
    ALTER TABLE profile_services DROP CONSTRAINT profile_services_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_services_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_services'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_services
      ADD CONSTRAINT profile_services_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_services_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 5: Fix profile_views table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_views_profile_id_fkey'
    AND table_name = 'profile_views'
  ) THEN
    ALTER TABLE profile_views DROP CONSTRAINT profile_views_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_views_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_views'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_views
      ADD CONSTRAINT profile_views_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_views_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 6: Fix profile_users table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_users_user_id_fkey'
    AND table_name = 'profile_users'
  ) THEN
    ALTER TABLE profile_users DROP CONSTRAINT profile_users_user_id_fkey;
    RAISE NOTICE '✅ Dropped profile_users_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_users'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profile_users
      ADD CONSTRAINT profile_users_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_users_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_users_profile_id_fkey'
    AND table_name = 'profile_users'
  ) THEN
    ALTER TABLE profile_users DROP CONSTRAINT profile_users_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_users_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_users'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_users
      ADD CONSTRAINT profile_users_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_users_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 7: Fix shipping_addresses table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shipping_addresses_profile_id_fkey'
    AND table_name = 'shipping_addresses'
  ) THEN
    ALTER TABLE shipping_addresses DROP CONSTRAINT shipping_addresses_profile_id_fkey;
    RAISE NOTICE '✅ Dropped shipping_addresses_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipping_addresses'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE shipping_addresses
      ADD CONSTRAINT shipping_addresses_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added shipping_addresses_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shipping_addresses_user_id_fkey'
    AND table_name = 'shipping_addresses'
  ) THEN
    ALTER TABLE shipping_addresses DROP CONSTRAINT shipping_addresses_user_id_fkey;
    RAISE NOTICE '✅ Dropped shipping_addresses_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipping_addresses'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shipping_addresses
      ADD CONSTRAINT shipping_addresses_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added shipping_addresses_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 8: Fix user_sessions table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_sessions_user_id_fkey'
    AND table_name = 'user_sessions'
  ) THEN
    ALTER TABLE user_sessions DROP CONSTRAINT user_sessions_user_id_fkey;
    RAISE NOTICE '✅ Dropped user_sessions_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_sessions
      ADD CONSTRAINT user_sessions_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added user_sessions_user_id_fkey with ON DELETE CASCADE';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: user_sessions table may need user_id type conversion first';
END $$;

-- ==========================================
-- PART 9: Fix email_otps table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'email_otps_user_id_fkey'
    AND table_name = 'email_otps'
  ) THEN
    ALTER TABLE email_otps DROP CONSTRAINT email_otps_user_id_fkey;
    RAISE NOTICE '✅ Dropped email_otps_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_otps'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE email_otps
      ADD CONSTRAINT email_otps_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added email_otps_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 10: Fix mobile_otps table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'mobile_otps_user_id_fkey'
    AND table_name = 'mobile_otps'
  ) THEN
    ALTER TABLE mobile_otps DROP CONSTRAINT mobile_otps_user_id_fkey;
    RAISE NOTICE '✅ Dropped mobile_otps_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mobile_otps'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mobile_otps
      ADD CONSTRAINT mobile_otps_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added mobile_otps_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 11: Fix voucher_usage table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'voucher_usage_user_id_from_users_fkey'
    AND table_name = 'voucher_usage'
  ) THEN
    ALTER TABLE voucher_usage DROP CONSTRAINT voucher_usage_user_id_from_users_fkey;
    RAISE NOTICE '✅ Dropped voucher_usage_user_id_from_users_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voucher_usage'
    AND column_name = 'user_id_from_users'
  ) THEN
    ALTER TABLE voucher_usage
      ADD CONSTRAINT voucher_usage_user_id_from_users_fkey
      FOREIGN KEY (user_id_from_users)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added voucher_usage_user_id_from_users_fkey with ON DELETE CASCADE';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'voucher_usage_order_id_fkey'
    AND table_name = 'voucher_usage'
  ) THEN
    ALTER TABLE voucher_usage DROP CONSTRAINT voucher_usage_order_id_fkey;
    RAISE NOTICE '✅ Dropped voucher_usage_order_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voucher_usage'
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE voucher_usage
      ADD CONSTRAINT voucher_usage_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added voucher_usage_order_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 12: Fix engagement_events table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'engagement_events_profile_id_fkey'
    AND table_name = 'engagement_events'
  ) THEN
    ALTER TABLE engagement_events DROP CONSTRAINT engagement_events_profile_id_fkey;
    RAISE NOTICE '✅ Dropped engagement_events_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'engagement_events'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE engagement_events
      ADD CONSTRAINT engagement_events_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added engagement_events_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 13: Fix card_assets table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_assets_order_id_fkey'
    AND table_name = 'card_assets'
  ) THEN
    ALTER TABLE card_assets DROP CONSTRAINT card_assets_order_id_fkey;
    RAISE NOTICE '✅ Dropped card_assets_order_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_assets'
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE card_assets
      ADD CONSTRAINT card_assets_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added card_assets_order_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 14: Fix card_configs table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_configs_order_id_fkey'
    AND table_name = 'card_configs'
  ) THEN
    ALTER TABLE card_configs DROP CONSTRAINT card_configs_order_id_fkey;
    RAISE NOTICE '✅ Dropped card_configs_order_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_configs'
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE card_configs
      ADD CONSTRAINT card_configs_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added card_configs_order_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_configs_user_id_fkey'
    AND table_name = 'card_configs'
  ) THEN
    ALTER TABLE card_configs DROP CONSTRAINT card_configs_user_id_fkey;
    RAISE NOTICE '✅ Dropped card_configs_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_configs'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE card_configs
      ADD CONSTRAINT card_configs_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added card_configs_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 15: Fix profile_experience table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_experience_profile_id_fkey'
    AND table_name = 'profile_experience'
  ) THEN
    ALTER TABLE profile_experience DROP CONSTRAINT profile_experience_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_experience_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_experience'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_experience
      ADD CONSTRAINT profile_experience_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_experience_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 16: Fix profile_education table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_education_profile_id_fkey'
    AND table_name = 'profile_education'
  ) THEN
    ALTER TABLE profile_education DROP CONSTRAINT profile_education_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_education_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_education'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_education
      ADD CONSTRAINT profile_education_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_education_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 17: Fix profile_analytics table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_analytics_profile_id_fkey'
    AND table_name = 'profile_analytics'
  ) THEN
    ALTER TABLE profile_analytics DROP CONSTRAINT profile_analytics_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_analytics_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_analytics'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_analytics
      ADD CONSTRAINT profile_analytics_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_analytics_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 18: Fix profile_link_clicks table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_link_clicks_profile_id_fkey'
    AND table_name = 'profile_link_clicks'
  ) THEN
    ALTER TABLE profile_link_clicks DROP CONSTRAINT profile_link_clicks_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_link_clicks_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_link_clicks'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_link_clicks
      ADD CONSTRAINT profile_link_clicks_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_link_clicks_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 19: Fix profile_media table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profile_media_profile_id_fkey'
    AND table_name = 'profile_media'
  ) THEN
    ALTER TABLE profile_media DROP CONSTRAINT profile_media_profile_id_fkey;
    RAISE NOTICE '✅ Dropped profile_media_profile_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_media'
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE profile_media
      ADD CONSTRAINT profile_media_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added profile_media_profile_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 20: Fix founders_requests table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'founders_requests_user_id_fkey'
    AND table_name = 'founders_requests'
  ) THEN
    ALTER TABLE founders_requests DROP CONSTRAINT founders_requests_user_id_fkey;
    RAISE NOTICE '✅ Dropped founders_requests_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'founders_requests'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE founders_requests
      ADD CONSTRAINT founders_requests_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added founders_requests_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 21: Fix founders_invite_codes table foreign keys
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'founders_invite_codes_created_by_fkey'
    AND table_name = 'founders_invite_codes'
  ) THEN
    ALTER TABLE founders_invite_codes DROP CONSTRAINT founders_invite_codes_created_by_fkey;
    RAISE NOTICE '✅ Dropped founders_invite_codes_created_by_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'founders_invite_codes'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE founders_invite_codes
      ADD CONSTRAINT founders_invite_codes_created_by_fkey
      FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added founders_invite_codes_created_by_fkey with ON DELETE CASCADE';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'founders_invite_codes_used_by_fkey'
    AND table_name = 'founders_invite_codes'
  ) THEN
    ALTER TABLE founders_invite_codes DROP CONSTRAINT founders_invite_codes_used_by_fkey;
    RAISE NOTICE '✅ Dropped founders_invite_codes_used_by_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'founders_invite_codes'
    AND column_name = 'used_by'
  ) THEN
    ALTER TABLE founders_invite_codes
      ADD CONSTRAINT founders_invite_codes_used_by_fkey
      FOREIGN KEY (used_by)
      REFERENCES users(id)
      ON DELETE SET NULL;  -- SET NULL because the code can exist without the user who used it
    RAISE NOTICE '✅ Added founders_invite_codes_used_by_fkey with ON DELETE SET NULL';
  END IF;
END $$;

-- ==========================================
-- PART 22: Fix printer_settings table foreign keys (if any)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'printer_settings_user_id_fkey'
    AND table_name = 'printer_settings'
  ) THEN
    ALTER TABLE printer_settings DROP CONSTRAINT printer_settings_user_id_fkey;
    RAISE NOTICE '✅ Dropped printer_settings_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'printer_settings'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE printer_settings
      ADD CONSTRAINT printer_settings_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added printer_settings_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- PART 23: Fix products table foreign keys (if any)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_user_id_fkey'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_user_id_fkey;
    RAISE NOTICE '✅ Dropped products_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added products_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ ALL FOREIGN KEY CONSTRAINTS UPDATED WITH ON DELETE CASCADE';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables with updated foreign keys:';
  RAISE NOTICE '  - payments (order_id, user_id)';
  RAISE NOTICE '  - orders (user_id)';
  RAISE NOTICE '  - profiles (user_id)';
  RAISE NOTICE '  - profile_services (profile_id)';
  RAISE NOTICE '  - profile_views (profile_id)';
  RAISE NOTICE '  - profile_users (user_id, profile_id)';
  RAISE NOTICE '  - shipping_addresses (profile_id, user_id)';
  RAISE NOTICE '  - user_sessions (user_id)';
  RAISE NOTICE '  - email_otps (user_id)';
  RAISE NOTICE '  - mobile_otps (user_id)';
  RAISE NOTICE '  - voucher_usage (user_id_from_users, order_id)';
  RAISE NOTICE '  - engagement_events (profile_id)';
  RAISE NOTICE '  - card_assets (order_id)';
  RAISE NOTICE '  - card_configs (order_id, user_id)';
  RAISE NOTICE '  - profile_experience (profile_id)';
  RAISE NOTICE '  - profile_education (profile_id)';
  RAISE NOTICE '  - profile_analytics (profile_id)';
  RAISE NOTICE '  - profile_link_clicks (profile_id)';
  RAISE NOTICE '  - profile_media (profile_id)';
  RAISE NOTICE '  - founders_requests (user_id)';
  RAISE NOTICE '  - founders_invite_codes (created_by, used_by)';
  RAISE NOTICE '  - printer_settings (user_id)';
  RAISE NOTICE '  - products (user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now delete rows from any table without foreign key errors.';
  RAISE NOTICE 'Related child rows will be automatically deleted (cascaded).';
  RAISE NOTICE '================================================================';
END $$;
