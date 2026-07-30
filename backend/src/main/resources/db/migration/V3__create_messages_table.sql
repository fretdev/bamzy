CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY ,
    public_id UUID NOT NULL  DEFAULT gen_random_uuid(),
    sender_id BIGINT NOT NULL ,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL ,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_messages_sender
                      FOREIGN KEY (sender_id) REFERENCES users(id)
                      ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver
                      FOREIGN KEY (receiver_id) REFERENCES  users(id)
                      ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_messages_public_id ON messages(public_id);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id,receiver_id);
CREATE INDEX idx_messages_receiver_sender ON messages(receiver_id,sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);