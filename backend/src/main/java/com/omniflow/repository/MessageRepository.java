package com.omniflow.repository;

import com.omniflow.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findByConversationAgentIdAndSenderTypeAndCreatedAtBetween(
            Long agentId,
            com.omniflow.model.SenderType senderType,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end
    );
}
