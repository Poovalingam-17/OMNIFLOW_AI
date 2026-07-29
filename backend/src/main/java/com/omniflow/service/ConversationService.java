package com.omniflow.service;

import com.omniflow.dto.request.CreateConversationRequest;
import com.omniflow.dto.request.SendMessageRequest;
import com.omniflow.dto.response.ConversationResponse;
import com.omniflow.dto.response.MessageResponse;
import com.omniflow.model.*;
import com.omniflow.repository.AgentRepository;
import com.omniflow.repository.ConversationRepository;
import com.omniflow.repository.MessageRepository;
import com.omniflow.repository.UserRepository;
import com.omniflow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AgentService agentService;

    @Autowired
    private GeminiService geminiService;

    public Conversation getConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    @Transactional
    public Message saveMessage(Long conversationId, SenderType senderType, String content) {
        Conversation conversation = getConversation(conversationId);
        
        // Auto-generate title from the first user message
        if (conversation.getMessageCount() == 0 && senderType == SenderType.USER) {
            String newTitle = generateTitleFromContent(content);
            conversation.setTitle(newTitle);
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderType(senderType);
        message.setContent(content);
        
        Message saved = messageRepository.save(message);
        
        conversation.setMessageCount(conversation.getMessageCount() + 1);
        conversationRepository.save(conversation);
        
        return saved;
    }

    private String generateTitleFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "New Conversation";
        }
        
        try {
            String titlePrompt = "Generate a very short 2 to 4 word topic title summarizing the user request. Output ONLY the title text. Do not include quotes, markdown, or punctuation.";
            String generatedTitle = geminiService.chat(titlePrompt, content, List.of(), null);
            if (generatedTitle != null && !generatedTitle.isBlank() && !generatedTitle.toLowerCase().contains("fallback")) {
                String cleanTitle = generatedTitle.trim().replaceAll("[\"']", "");
                if (cleanTitle.length() > 30) {
                    cleanTitle = cleanTitle.substring(0, 27) + "...";
                }
                return cleanTitle;
            }
        } catch (Exception e) {
            System.err.println("Could not generate summary title via Gemini, falling back to substring: " + e.getMessage());
        }

        String cleanContent = content.trim().replaceAll("\\s+", " ");
        if (cleanContent.length() <= 25) {
            return cleanContent;
        }
        int endIndex = cleanContent.lastIndexOf(' ', 25);
        if (endIndex == -1) endIndex = 25;
        return cleanContent.substring(0, endIndex) + "...";
    }

    @Transactional
    public ConversationResponse createConversation(CreateConversationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Agent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        String title = request.getTitle() != null && !request.getTitle().isBlank() 
                ? request.getTitle() 
                : "Chat with " + agent.getName();

        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setAgent(agent);
        conversation.setTitle(title);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setMessageCount(0);

        Conversation savedConversation = conversationRepository.save(conversation);
        return mapToConversationResponse(savedConversation);
    }

    public List<ConversationResponse> getUserConversations(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return conversationRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(principal.getId(), ConversationStatus.ACTIVE)
                .stream()
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(Long conversationId, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // 1. Save User message
        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setSenderType(SenderType.USER);
        userMessage.setContent(request.getContent());
        messageRepository.save(userMessage);

        // 2. Generate and Save Mock Agent message
        Message agentMessage = new Message();
        agentMessage.setConversation(conversation);
        agentMessage.setSenderType(SenderType.AGENT);
        
        String reply = generateMockReply(conversation.getAgent(), request.getContent());
        agentMessage.setContent(reply);
        agentMessage.setTokensUsed((int) (reply.length() * 0.7));
        agentMessage.setResponseTimeMs(400); 
        agentMessage.setIsRag(true);
        agentMessage.setSources("[\"OmniFlow Internal KB\", \"" + conversation.getAgent().getDomain() + " Guide\"]");
        
        Message savedAgentMessage = messageRepository.save(agentMessage);

        // 3. Update message count in conversation
        conversation.setMessageCount(conversation.getMessageCount() + 2);
        conversationRepository.save(conversation);

        return mapToMessageResponse(savedAgentMessage);
    }

    @Transactional
    public void deleteConversation(Long id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversation.setStatus(ConversationStatus.DELETED);
        conversationRepository.save(conversation);
    }

    private String generateMockReply(Agent agent, String query) {
        String queryLower = query.toLowerCase();
        if (queryLower.contains("hello") || queryLower.contains("hi")) {
            return "Hello! I am " + agent.getName() + ", your specialized agent in " + agent.getDomain() + ". How can I assist you today?";
        }
        
        switch (agent.getDomain()) {
            case "Customer Support":
                return "I have reviewed your request. Let me check the ticket logs. Our systems indicate high operational availability. How can I assist you further?";
            case "Human Resources":
                return "Regarding your HR query, the company policy supports complete lifecycle guidance. You can check detailed documents inside the internal wiki portal.";
            case "Finance":
                return "Based on modern financial projections, optimizing resources will decrease operational overheads. I suggest reviewing our latest budget sheets.";
            default:
                return "Thank you for the query. I am processing your message regarding: '" + query + "' under system prompts guidelines.";
        }
    }

    private ConversationResponse mapToConversationResponse(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .userId(conversation.getUser().getId())
                .agent(agentService.mapToAgentResponse(conversation.getAgent()))
                .title(conversation.getTitle())
                .status(conversation.getStatus().name())
                .messageCount(conversation.getMessageCount())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private MessageResponse mapToMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderType(message.getSenderType().name())
                .content(message.getContent())
                .tokensUsed(message.getTokensUsed())
                .responseTimeMs(message.getResponseTimeMs())
                .isRag(message.getIsRag())
                .sources(message.getSources())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
