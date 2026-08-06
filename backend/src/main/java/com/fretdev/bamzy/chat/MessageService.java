package com.fretdev.bamzy.chat;

import com.fretdev.bamzy.chat.dto.MessageResponse;
import com.fretdev.bamzy.chat.dto.SendMessageRequest;
import com.fretdev.bamzy.user.User;
import com.fretdev.bamzy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageResponse sendMessage(String senderUsername, SendMessageRequest request){
        User sender = userRepository.findByUsername(senderUsername).orElseThrow(()-> new BadCredentialsException("Invalid sender"));
        User receiver = userRepository.findByUsername(request.receiverUsername()).orElseThrow(()-> new IllegalArgumentException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.content())
                .build();

        Message saved = messageRepository.save(message);
        return mapToResponse(saved);
    }

    public List<MessageResponse> getConversation(String currentUsername, String otherUsername, int limit){
        User currentuser = userRepository.findByUsername(currentUsername).orElseThrow(()-> new BadCredentialsException("Invalid user"));
        User otherUser = userRepository.findByUsername(otherUsername).orElseThrow(()-> new IllegalArgumentException("User not found"));

        Pageable pageable = PageRequest.of(0, limit);
        List<Message> messages = messageRepository.findConversation(currentuser.getId(), otherUser.getId(), pageable);

        Collections.reverse(messages);

        return messages.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteMessage(String publicId, String currentUsername) {
        Message message = messageRepository.findByPublicId(publicId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        // Only sender or receiver can delete the message
        boolean isSender = message.getSender().getUsername().equalsIgnoreCase(currentUsername);
        boolean isReceiver = message.getReceiver().getUsername().equalsIgnoreCase(currentUsername);

        if (!isSender && !isReceiver) {
            throw new BadCredentialsException("Not authorized to delete this message");
        }

        messageRepository.delete(message);
    }

    private MessageResponse mapToResponse(Message message){
        return new MessageResponse(
          message.getPublicId(),
          message.getSender().getUsername(),
          message.getReceiver().getUsername(),
          message.getContent(),
          message.getStatus(),
          message.getCreatedAt()
        );
    }
}
