package com.omniflow.service;

import com.omniflow.dto.request.FeedbackRequest;
import com.omniflow.model.*;
import com.omniflow.repository.*;
import com.omniflow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeedbackService {

    @Autowired
    private UserFeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Transactional
    public UserFeedback submitFeedback(FeedbackRequest request) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        UserFeedback feedback = new UserFeedback();
        feedback.setUser(user);
        feedback.setConversation(conversation);
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        if (request.getMessageId() != null) {
            messageRepository.findById(request.getMessageId())
                    .ifPresent(feedback::setMessage);
        }

        return feedbackRepository.save(feedback);
    }

    public List<UserFeedback> getAgentFeedback(Long agentId) {
        return feedbackRepository.findByConversationAgentId(agentId);
    }
}
