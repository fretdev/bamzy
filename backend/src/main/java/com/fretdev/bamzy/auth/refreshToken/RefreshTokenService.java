package com.fretdev.bamzy.auth.refreshToken;

import com.fretdev.bamzy.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    public String createRefreshToken(User user){
        String rawToken = generateSecureRandomToken();

        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(rawToken));
        entity.setExpiresAt(Instant.now().plusMillis(refreshTokenExpiry));
        refreshTokenRepository.save(entity);
        return rawToken;
    }
    private String generateSecureRandomToken(){
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private String hash(String raw){
        try{
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e){
            throw new IllegalStateException(e);
        }
    }

    @Transactional
    public RefreshToken validateAndRotate(String rawToken){
        String hashed = hash(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hashed).orElseThrow(()->new BadCredentialsException("Invalid refresh token"));

        if (existing.isRevoked() || existing.getExpiresAt().isBefore(Instant.now())){
            revokeAllForUser(existing.getUser());
            throw new BadCredentialsException("Refresh token invalid or reused");
        }
        existing.setRevoked(true);
        refreshTokenRepository.save(existing);
        return existing;
    }

    @Transactional
    public void revokeAllForUser(User user){
        refreshTokenRepository.revokeAllByUser(user);
    }

}
