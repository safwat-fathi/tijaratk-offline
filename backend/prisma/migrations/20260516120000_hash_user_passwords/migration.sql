-- Ensure PostgreSQL bcrypt-compatible hashing helpers are available.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION app.hash_user_password()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.password IS NOT NULL
     AND NEW.password !~ '^\$2[aby]\$[0-9]{2}\$.{53}$' THEN
    NEW.password := crypt(NEW.password, gen_salt('bf', 10));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_hash_password_before_write ON public.users;

CREATE TRIGGER users_hash_password_before_write
BEFORE INSERT OR UPDATE OF password ON public.users
FOR EACH ROW
EXECUTE FUNCTION app.hash_user_password();

-- Backfill existing rows through the trigger without re-hashing bcrypt values.
UPDATE public.users
SET password = password
WHERE password !~ '^\$2[aby]\$[0-9]{2}\$.{53}$';
