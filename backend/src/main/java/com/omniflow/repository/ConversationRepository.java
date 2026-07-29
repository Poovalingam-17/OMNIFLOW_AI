package com.omniflow.repository;

import com.omniflow.model.Conversation;
import com.omniflow.model.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, ConversationStatus status);
    List<Conversation> findByAgentId(Long agentId);
}
