-- WF-23: User credentials for Sale authentication
-- Store bcrypt password hashes, never plaintext passwords.

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id UUID PRIMARY KEY
        REFERENCES users(id) ON DELETE CASCADE,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
