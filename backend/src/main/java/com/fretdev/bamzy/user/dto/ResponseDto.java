package com.fretdev.bamzy.user.dto;

import com.fretdev.bamzy.user.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResponseDto(
        UUID publicId,
        String username,
        String email,
        UserStatus status,
        LocalDateTime lastSeen,
        LocalDateTime createdAt
) {
}
