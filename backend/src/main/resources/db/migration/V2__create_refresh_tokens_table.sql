CREATE TABLE refresh_tokens(
    id BigSerial PRIMARY KEY ,
    token_hash VARCHAR(255) NOT NULL UNIQUE ,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT  now(),
    CONSTRAINT fk_refresh_tokens_user
                           FOREIGN KEY (user_id) REFERENCES users(id)
                           ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);