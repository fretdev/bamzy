package com.fretdev.bamzy.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    public record UserSummaryDto(String username, String status) {}

    @GetMapping
    public ResponseEntity<List<UserSummaryDto>> getAllUsers(Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : "";
        List<UserSummaryDto> users = userRepository.findAll().stream()
                .filter(u -> !u.getUsername().equalsIgnoreCase(currentUsername))
                .map(u -> new UserSummaryDto(u.getUsername(), u.getStatus() != null ? u.getStatus().name() : "OFFLINE"))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
