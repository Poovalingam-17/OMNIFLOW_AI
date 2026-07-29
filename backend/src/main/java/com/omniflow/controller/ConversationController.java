package com.omniflow.controller;

import com.omniflow.dto.request.CreateConversationRequest;
import com.omniflow.dto.request.SendMessageRequest;
import com.omniflow.dto.response.ConversationResponse;
import com.omniflow.dto.response.MessageResponse;
import com.omniflow.service.ConversationService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import com.omniflow.service.AgentOrchestrator;
import com.omniflow.model.Message;
import com.omniflow.model.SenderType;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    
    @Autowired
    private ConversationService conversationService;

    @Autowired
    private AgentOrchestrator agentOrchestrator;
    
    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(conversationService.createConversation(request));
    }
    
    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getUserConversations(Authentication authentication) {
        return ResponseEntity.ok(conversationService.getUserConversations(authentication));
    }
    
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.getConversationMessages(id));
    }
    
    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable Long id, @Valid @RequestBody SendMessageRequest request) {
        // Save user message first
        conversationService.saveMessage(id, SenderType.USER, request.getContent());
        
        // Dispatch query to agent orchestrator
        Message agentResponse = agentOrchestrator.processChatRequest(id, request.getContent(), request.getImageBase64());
        
        return ResponseEntity.ok(MessageResponse.from(agentResponse));
    }

    @PostMapping(value = "/{id}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public void sendMessageStream(@PathVariable Long id,
                                   @Valid @RequestBody SendMessageRequest request,
                                   HttpServletResponse response) throws IOException {
        response.setContentType(MediaType.TEXT_EVENT_STREAM_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");

        // Save user message
        conversationService.saveMessage(id, SenderType.USER, request.getContent());

        // Get full Gemini response (saves agent message to DB too)
        Message agentMessage = agentOrchestrator.processChatRequest(id, request.getContent(), request.getImageBase64());
        String fullText = agentMessage.getContent();

        // Stream response word-by-word as SSE — fully synchronous, no async dispatch
        String[] tokens = fullText.split("(?<=\\s)|(?=\\s)");
        PrintWriter writer = response.getWriter();
        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        for (String token : tokens) {
            String json = objectMapper.writeValueAsString(java.util.Map.of("token", token));
            writer.write("data:" + json + "\n\n");
            writer.flush();
            try { Thread.sleep(25); } catch (InterruptedException ignored) {}
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.ok(Map.of("message", "Conversation deleted"));
    }
}
