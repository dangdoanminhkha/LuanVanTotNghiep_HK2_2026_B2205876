-- Add Google OAuth columns to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'; -- 'email', 'google', 'facebook', etc.
ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL;

-- Create index for faster google_id lookups
CREATE INDEX idx_google_id ON users(google_id);
CREATE INDEX idx_auth_provider ON users(auth_provider);
