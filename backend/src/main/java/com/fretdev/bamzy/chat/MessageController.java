package com.fretdev.bamzy.chat;

import com.fretdev.bamzy.chat.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping("/history/{otherUsername}")
    public ResponseEntity<List<MessageResponse>> getHistory(
            @PathVariable String otherUsername,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication
    ){
        String currentUsername = authentication.getName();
        List<MessageResponse> messages = messageService.getConversation(currentUsername, otherUsername, limit);
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/{publicId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String publicId,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();
        messageService.deleteMessage(publicId, currentUsername);
        return ResponseEntity.noContent().build();
    }
}
