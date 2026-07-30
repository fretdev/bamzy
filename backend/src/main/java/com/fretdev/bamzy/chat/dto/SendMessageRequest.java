package com.fretdev.bamzy.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Receiver usernmae is required")
        String receiverUsername,

        @NotBlank(message = "Message contentis required")
        String content
) {
}
