-- DataMind AI: Ensure user_settings table exists and is properly configured
-- This migration is idempotent and can be run multiple times safely

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Appearance
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  compact_density BOOLEAN NOT NULL DEFAULT false,

  -- Profile preferences
  timezone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en',

  -- AI preferences
  ai_response_style TEXT NOT NULL DEFAULT 'balanced' CHECK (ai_response_style IN ('concise', 'balanced', 'detailed')),
  ai_detail_level TEXT NOT NULL DEFAULT 'standard' CHECK (ai_detail_level IN ('basic', 'standard', 'advanced')),
  ai_explain_results BOOLEAN NOT NULL DEFAULT true,
  ai_show_limitations BOOLEAN NOT NULL DEFAULT true,
  ai_ask_before_expensive BOOLEAN NOT NULL DEFAULT true,
  ai_model_preference TEXT,

  -- Notification preferences
  notification_preferences JSONB NOT NULL DEFAULT '{
    "analysis_completed": {"in_app": true, "email": false},
    "model_training_completed": {"in_app": true, "email": false},
    "agent_completed": {"in_app": true, "email": false},
    "report_generated": {"in_app": true, "email": false},
    "job_failed": {"in_app": true, "email": true},
    "security_events": {"in_app": true, "email": true}
  }'::jsonb,

  -- Privacy
  analytics_opt_out BOOLEAN NOT NULL DEFAULT false,
  activity_visibility TEXT NOT NULL DEFAULT 'private' CHECK (activity_visibility IN ('private', 'team')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own settings
DROP POLICY IF EXISTS user_settings_select_policy ON user_settings;
CREATE POLICY user_settings_select_policy ON user_settings
  FOR SELECT USING (user_id = auth.uid() OR current_user = 'postgres');

DROP POLICY IF EXISTS user_settings_insert_policy ON user_settings;
CREATE POLICY user_settings_insert_policy ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid() OR current_user = 'postgres');

DROP POLICY IF EXISTS user_settings_update_policy ON user_settings;
CREATE POLICY user_settings_update_policy ON user_settings
  FOR UPDATE USING (user_id = auth.uid() OR current_user = 'postgres');

DROP POLICY IF EXISTS user_settings_delete_policy ON user_settings;
CREATE POLICY user_settings_delete_policy ON user_settings
  FOR DELETE USING (user_id = auth.uid() OR current_user = 'postgres');

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_user_settings_on_user_created ON users;
CREATE TRIGGER create_user_settings_on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();
