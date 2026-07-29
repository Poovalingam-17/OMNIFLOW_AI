package com.omniflow.agent;

import com.omniflow.model.Conversation;
import com.omniflow.model.Message;
import com.omniflow.model.SenderType;
import com.omniflow.repository.MessageRepository;
import com.omniflow.repository.ConversationRepository;
import com.omniflow.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.stream.Collectors;

@Component
public abstract class BaseAgent {
    
    @Autowired
    protected GeminiService geminiService;
    
    @Autowired
    protected MessageRepository messageRepository;

    @Autowired
    protected ConversationRepository conversationRepository;
    
    public abstract String getAgentId();
    public abstract String getName();
    public abstract String getDomain();
    public abstract String getSystemPrompt();
    
    public Message processMessage(Conversation conversation, String userMessage, String imageBase64) {
        List<Message> history = messageRepository
            .findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        
        List<Message> recentHistory = history.stream()
            .skip(Math.max(0, history.size() - 11)) // skip latest; get past 10
            .limit(10)
            .collect(Collectors.toList());
        
        long startTime = System.currentTimeMillis();
        String responseText = geminiService.chat(
            getSystemPrompt(),
            userMessage,
            recentHistory,
            imageBase64
        );
        int responseTimeMs = (int) (System.currentTimeMillis() - startTime);
        
        Message agentMessage = new Message();
        agentMessage.setConversation(conversation);
        agentMessage.setSenderType(SenderType.AGENT);
        agentMessage.setContent(responseText);
        agentMessage.setTokensUsed((int)(responseText.length() * 0.3));
        agentMessage.setResponseTimeMs(responseTimeMs);
        agentMessage.setIsRag(false);
        agentMessage.setSources(null);
        
        Message saved = messageRepository.save(agentMessage);

        // Update messageCount in database
        conversation.setMessageCount(conversation.getMessageCount() + 1);
        conversationRepository.save(conversation);

        return saved;
    }

    // Keep backwards compatible signature
    public Message processMessage(Conversation conversation, String userMessage) {
        return processMessage(conversation, userMessage, null);
    }

    public Flux<String> processMessageStream(Conversation conversation, String userMessage, String imageBase64) {
        List<Message> history = messageRepository
            .findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        
        List<Message> recentHistory = history.stream()
            .skip(Math.max(0, history.size() - 11))
            .limit(10)
            .collect(Collectors.toList());
            
        long startTime = System.currentTimeMillis();
        String responseText = geminiService.chat(
            getSystemPrompt(),
            userMessage,
            recentHistory,
            imageBase64
        );
        int responseTimeMs = (int) (System.currentTimeMillis() - startTime);
        
        Message agentMessage = new Message();
        agentMessage.setConversation(conversation);
        agentMessage.setSenderType(SenderType.AGENT);
        agentMessage.setContent(responseText);
        agentMessage.setTokensUsed((int)(responseText.length() * 0.3));
        agentMessage.setResponseTimeMs(responseTimeMs);
        agentMessage.setIsRag(false);
        agentMessage.setSources(null);
        
        messageRepository.save(agentMessage);

        // Update messageCount in database
        conversation.setMessageCount(conversation.getMessageCount() + 1);
        conversationRepository.save(conversation);

        // Return word-by-word Flux stream of the response
        String[] tokens = responseText.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(tokens)
                   .delayElements(java.time.Duration.ofMillis(30));
    }

    // Keep backwards compatible signature
    public Flux<String> processMessageStream(Conversation conversation, String userMessage) {
        return processMessageStream(conversation, userMessage, null);
    }
}
