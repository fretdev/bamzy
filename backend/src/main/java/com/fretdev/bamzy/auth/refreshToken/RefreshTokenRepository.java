package com.fretdev.bamzy.auth.refreshToken;

import com.fretdev.bamzy.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user WHERE rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user = :user AND r.revoked = false")
    void revokeAllByUser(@Param("user")User user);
}

