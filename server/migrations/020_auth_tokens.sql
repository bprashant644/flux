-- Email verification + password reset tokens (self-hosted equivalent of a hosted auth
-- provider's built-in flows — see server/routes/auth.js).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) UNIQUE NOT NULL,
  type       VARCHAR(20) NOT NULL CHECK (type IN ('verify_email', 'reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens (token);

-- Existing users predate email verification entirely — treat them as already verified
-- rather than locking everyone out on the next deploy.
UPDATE users SET email_verified = TRUE WHERE email_verified IS NOT TRUE;
