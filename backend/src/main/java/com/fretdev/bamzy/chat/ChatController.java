package com.fretdev.bamzy.chat;

import com.fretdev.bamzy.chat.dto.MessageResponse;
import com.fretdev.bamzy.chat.dto.SendMessageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request, Authentication authentication){
        String senderUsername = authentication.getName();

        MessageResponse response = messageService.sendMessage(senderUsername,request);

        messagingTemplate.convertAndSend("/topic/messages/"+response.senderUsername(),response);
        messagingTemplate.convertAndSend("/topic/messages/"+response.receiverUsername(),response);
    }
}
