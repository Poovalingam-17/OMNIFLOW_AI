package com.omniflow.controller;

import com.omniflow.dto.request.FeedbackRequest;
import com.omniflow.model.UserFeedback;
import com.omniflow.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<?> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        feedbackService.submitFeedback(request);
        return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully"));
    }

    @GetMapping("/agents/{agentId}")
    public ResponseEntity<List<UserFeedback>> getAgentFeedback(@PathVariable Long agentId) {
        return ResponseEntity.ok(feedbackService.getAgentFeedback(agentId));
    }
}
