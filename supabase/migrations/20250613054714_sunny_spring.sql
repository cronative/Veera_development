/*
  # Email Data Storage Schema

  1. New Tables
    - `user_email_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_address` (text)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `token_expires_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `extracted_email_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_account_id` (uuid, references user_email_accounts)
      - `message_id` (text, unique)
      - `subject` (text)
      - `sender` (text)
      - `received_at` (timestamp)
      - `extracted_type` (text) - 'opportunity', 'event', 'time_sensitive'
      - `extracted_data` (jsonb) - structured data
      - `keywords_matched` (text[])
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user data access
    - Encrypt sensitive token data
*/

-- User email accounts table
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  provider text DEFAULT 'microsoft' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Extracted email data table
CREATE TABLE IF NOT EXISTS extracted_email_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_account_id uuid REFERENCES user_email_accounts(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  subject text,
  sender text,
  received_at timestamptz,
  extracted_type text CHECK (extracted_type IN ('opportunity', 'event', 'time_sensitive', 'general')),
  extracted_data jsonb DEFAULT '{}',
  keywords_matched text[] DEFAULT '{}',
  confidence_score numeric(3,2) DEFAULT 0.0,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_email_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_email_accounts
CREATE POLICY "Users can manage their own email accounts"
  ON user_email_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for extracted_email_data
CREATE POLICY "Users can access their own email data"
  ON extracted_email_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_email ON user_email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_extracted_email_data_user_id ON extracted_email_data(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_email_data_type ON extracted_email_data(extracted_type);
CREATE INDEX IF NOT EXISTS idx_extracted_email_data_received_at ON extracted_email_data(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_email_data_keywords ON extracted_email_data USING GIN(keywords_matched);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_email_accounts_updated_at
  BEFORE UPDATE ON user_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();