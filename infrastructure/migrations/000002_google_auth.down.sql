ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL,
    DROP COLUMN IF EXISTS google_id;
