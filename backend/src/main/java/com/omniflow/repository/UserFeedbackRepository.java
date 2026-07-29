package com.omniflow.repository;

import com.omniflow.model.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {
    
    @Query("SELECT COALESCE(AVG(uf.rating), 0.0) FROM UserFeedback uf")
    double getAverageRating();
    
    List<UserFeedback> findByConversationAgentId(Long agentId);
}
