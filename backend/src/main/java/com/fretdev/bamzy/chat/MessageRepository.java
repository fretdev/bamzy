package com.fretdev.bamzy.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    Optional<Message> findByPublicId(String publicId);

    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        JOIN FETCH m.receiver
        WHERE (m.sender.id = :userAId AND m.receiver.id = :userBId)
        OR (m.sender.id = :userBId AND m.receiver.id = :userAId)
        ORDER BY m.createdAt DESC
    """)
    List<Message> findConversation(
            @Param("userAId") Long userAId,
            @Param("userBId") Long userBId,
            Pageable pageable
    );
}
