-- Migration: create_custom_email_accounts
-- Purpose: store custom SMTP/IMAP/POP3 account configs for FlowServiceBackend / Neon
-- Note: Passwords should be stored encrypted by the application. This migration creates a column
-- for encrypted data but does NOT perform encryption itself.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS custom_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  email varchar(255) NOT NULL,
  display_name varchar(255),
  provider varchar(50) DEFAULT 'custom',

  -- SMTP
  smtp_server varchar(255),
  smtp_port integer,
  smtp_security varchar(20),

  -- IMAP
  imap_server varchar(255),
  imap_port integer,
  imap_security varchar(20),

  -- POP3
  pop3_server varchar(255),
  pop3_port integer,
  pop3_security varchar(20),

  -- Store encrypted credentials here (application must encrypt/decrypt)
  encrypted_password text,

  is_active boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_email_accounts_user_id ON custom_email_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_custom_email_accounts_user_email ON custom_email_accounts(user_id, email);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON custom_email_accounts;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON custom_email_accounts
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
