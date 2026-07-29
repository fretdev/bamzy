package com.fretdev.bamzy.auth;

import com.fretdev.bamzy.auth.dto.LoginRequest;
import com.fretdev.bamzy.auth.dto.AuthResponse;
import com.fretdev.bamzy.auth.dto.RegisterRequest;
import com.fretdev.bamzy.auth.jwt.JwtService;
import com.fretdev.bamzy.auth.refreshToken.RefreshToken;
import com.fretdev.bamzy.auth.refreshToken.RefreshTokenService;
import com.fretdev.bamzy.auth.refreshToken.dto.RefreshRequest;
import com.fretdev.bamzy.user.User;
import com.fretdev.bamzy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request){
        if(userRepository.existsByUsername(request.username())){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Username already taken");
        }
        if (userRepository.existsByEmail(request.email())){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        User savedUser = userRepository.save(user);
        return issueTokens(savedUser);
    }

    public AuthResponse login(LoginRequest request){
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(),request.password())
        );
        User user = userRepository.findByUsername(request.username()).orElseThrow(()->new BadCredentialsException("Invalid credentials"));
        return issueTokens(user);
    }
    private AuthResponse issueTokens(User user){
        String accessToken = jwtService.generateAccessToken(user.getUsername());
        String refreshToken = refreshTokenService.createRefreshToken(user);
        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                user.getPublicId(),
                user.getUsername()
        );
    }

    public AuthResponse refresh(RefreshRequest request){
        RefreshToken rotated = refreshTokenService.validateAndRotate(request.refreshToken());
        return issueTokens(rotated.getUser());
    }

    public void logout(UserDetails userDetails){
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(()-> new BadCredentialsException("Invalid user"));
        refreshTokenService.revokeAllForUser(user);
    }
}
