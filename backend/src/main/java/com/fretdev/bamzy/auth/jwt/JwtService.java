package com.fretdev.bamzy.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry}")
    private Long accessTokenExpiry;

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String username){
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiry)))
                .signWith(getSignInKey(),Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token){
        return parseClaims(token).getSubject();
    }

    private Claims parseClaims(String token){
        return  Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token){
        try{
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());

        }
        catch (JwtException | IllegalArgumentException e){
            return false;
        }
    }
}
