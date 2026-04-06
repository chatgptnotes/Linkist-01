-- Fix CHECK constraints on users and user_sessions tables
-- Since roles are now managed dynamically via the admin panel,
-- remove restrictive CHECK constraints that block new custom roles.

-- 1. Drop the restrictive CHECK constraint on users.role
-- New roles can be created via the admin UI, so we can't hardcode allowed values.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Drop the restrictive CHECK constraint on user_sessions.role
-- The old constraint only allowed ('user', 'admin') which blocked staff roles.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid
      AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'user_sessions'
      AND att.attname = 'role'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE user_sessions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
