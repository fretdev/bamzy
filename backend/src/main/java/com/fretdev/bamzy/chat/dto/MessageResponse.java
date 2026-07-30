package com.fretdev.bamzy.chat.dto;

import com.fretdev.bamzy.chat.MessageStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID publicId,
        String senderUsername,
        String receiverUsername,
        String content,
        MessageStatus status,
        LocalDateTime createdAt
) {
}
