package com.omniflow.service;

import com.omniflow.agent.BaseAgent;
import com.omniflow.agent.EducationAgent;
import com.omniflow.agent.HRAgent;
import com.omniflow.agent.HealthcareAgent;
import com.omniflow.model.Conversation;
import com.omniflow.model.Message;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AgentOrchestrator {
    
    private final Map<String, BaseAgent> agentRegistry = new HashMap<>();
    
    @Autowired
    private EducationAgent educationAgent;
    
    @Autowired
    private HRAgent hrAgent;
    
    @Autowired
    private HealthcareAgent healthcareAgent;
    
    @Autowired
    private ConversationService conversationService;
    
    @PostConstruct
    public void init() {
        // Register by agentId (for fresh DB seeded agents)
        agentRegistry.put("education-agent", educationAgent);
        agentRegistry.put("hr-agent", hrAgent);
        agentRegistry.put("healthcare-agent", healthcareAgent);
        // Register by name (fallback for agents with empty agentId in DB)
        agentRegistry.put("Personal Tutor Agent", educationAgent);
        agentRegistry.put("HR Assistant Agent", hrAgent);
        agentRegistry.put("Healthcare Assistant Agent", healthcareAgent);
    }
    
    public Message processChatRequest(Long conversationId, String userMessage, String imageBase64) {
        Conversation conversation = conversationService.getConversation(conversationId);
        String agentId = conversation.getAgent().getAgentId();
        String agentName = conversation.getAgent().getName();

        // Try agentId first, fall back to name
        BaseAgent agent = agentRegistry.get(agentId);
        if (agent == null) {
            agent = agentRegistry.get(agentName);
        }
        if (agent == null) {
            throw new IllegalArgumentException("Agent not found for agentId='" + agentId + "', name='" + agentName + "'");
        }
        
        return agent.processMessage(conversation, userMessage, imageBase64);
    }

    public Flux<String> processChatRequestStream(Long conversationId, String userMessage, String imageBase64) {
        Conversation conversation = conversationService.getConversation(conversationId);
        String agentId = conversation.getAgent().getAgentId();
        String agentName = conversation.getAgent().getName();

        // Try agentId first, fall back to name
        BaseAgent agent = agentRegistry.get(agentId);
        if (agent == null) {
            agent = agentRegistry.get(agentName);
        }
        if (agent == null) {
            throw new IllegalArgumentException("Agent not found for agentId='" + agentId + "', name='" + agentName + "'");
        }
        
        return agent.processMessageStream(conversation, userMessage, imageBase64);
    }
    
    public List<BaseAgent> getAllAgents() {
        return new ArrayList<>(agentRegistry.values());
    }
}
