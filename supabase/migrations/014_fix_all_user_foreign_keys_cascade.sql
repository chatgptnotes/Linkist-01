-- Migration: Fix all user_id foreign keys to use ON DELETE CASCADE
-- Purpose: Allow deleting users without foreign key constraint violations
-- Date: 2025-12-09

-- ==========================================
-- Fix profiles table foreign key
-- ==========================================
DO $$
BEGIN
  -- Drop existing foreign key if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_user_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
    RAISE NOTICE '✅ Dropped profiles_user_id_fkey';
  END IF;

  -- Re-add with CASCADE
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
-- Fix email_campaign_recipients table foreign key
-- ==========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'email_campaign_recipients_user_id_fkey'
    AND table_name = 'email_campaign_recipients'
  ) THEN
    ALTER TABLE email_campaign_recipients DROP CONSTRAINT email_campaign_recipients_user_id_fkey;
    RAISE NOTICE '✅ Dropped email_campaign_recipients_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_campaign_recipients'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE email_campaign_recipients
      ADD CONSTRAINT email_campaign_recipients_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added email_campaign_recipients_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- Fix support_tickets table foreign key
-- ==========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'support_tickets_user_id_fkey'
    AND table_name = 'support_tickets'
  ) THEN
    ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_user_id_fkey;
    RAISE NOTICE '✅ Dropped support_tickets_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE support_tickets
      ADD CONSTRAINT support_tickets_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added support_tickets_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- Fix analytics_events table foreign key
-- ==========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'analytics_events_user_id_fkey'
    AND table_name = 'analytics_events'
  ) THEN
    ALTER TABLE analytics_events DROP CONSTRAINT analytics_events_user_id_fkey;
    RAISE NOTICE '✅ Dropped analytics_events_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_events'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE analytics_events
      ADD CONSTRAINT analytics_events_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added analytics_events_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- Fix orders table foreign key (if exists)
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
-- Fix payments table foreign key (if exists)
-- ==========================================
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
-- Fix user_sessions table foreign key (if exists)
-- Need to convert user_id from TEXT to UUID first
-- ==========================================
DO $$
BEGIN
  -- Drop existing foreign key if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_sessions_user_id_fkey'
    AND table_name = 'user_sessions'
  ) THEN
    ALTER TABLE user_sessions DROP CONSTRAINT user_sessions_user_id_fkey;
    RAISE NOTICE '✅ Dropped user_sessions_user_id_fkey';
  END IF;

  -- Check if user_id column is TEXT type and convert to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions'
    AND column_name = 'user_id'
    AND data_type = 'text'
  ) THEN
    -- Convert TEXT to UUID (this will fail if there are invalid UUIDs)
    ALTER TABLE user_sessions
      ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    RAISE NOTICE '✅ Converted user_sessions.user_id from TEXT to UUID';
  END IF;

  -- Add foreign key constraint if column exists and is UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions'
    AND column_name = 'user_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE user_sessions
      ADD CONSTRAINT user_sessions_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added user_sessions_user_id_fkey with ON DELETE CASCADE';
  END IF;
END $$;

-- ==========================================
-- Fix profile_users table foreign key (if exists)
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

-- ==========================================
-- Fix voucher_usage table foreign key (if exists)
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

-- ==========================================
-- Fix profile_services table foreign key (profile_id references profiles)
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
-- Fix profile_views table foreign key (if exists)
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
-- Fix shipping_addresses table foreign key (if references profiles)
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

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ All user_id foreign keys updated with ON DELETE CASCADE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - email_campaign_recipients';
  RAISE NOTICE '  - support_tickets';
  RAISE NOTICE '  - analytics_events';
  RAISE NOTICE '  - orders';
  RAISE NOTICE '  - payments';
  RAISE NOTICE '  - user_sessions';
  RAISE NOTICE '  - profile_users';
  RAISE NOTICE '  - voucher_usage';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now delete users and all related data will be automatically deleted.';
  RAISE NOTICE '========================================';
END $$;
