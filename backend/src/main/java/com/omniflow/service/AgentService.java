package com.omniflow.service;

import com.omniflow.dto.request.CreateAgentRequest;
import com.omniflow.dto.request.UpdateAgentRequest;
import com.omniflow.dto.response.AgentResponse;
import com.omniflow.model.Agent;
import com.omniflow.repository.AgentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AgentService {

    @Autowired
    private AgentRepository agentRepository;

    public List<AgentResponse> getAllAgents() {
        return agentRepository.findAll().stream()
                .map(this::mapToAgentResponse)
                .collect(Collectors.toList());
    }

    public AgentResponse getAgentById(Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found with id: " + id));
        return mapToAgentResponse(agent);
    }

    @Transactional
    public AgentResponse createAgent(CreateAgentRequest request) {
        if (agentRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Agent with name '" + request.getName() + "' already exists.");
        }

        Agent agent = new Agent();
        agent.setName(request.getName());
        agent.setDomain(request.getDomain());
        agent.setDescription(request.getDescription());
        agent.setSystemPrompt(request.getSystemPrompt());
        agent.setModel(request.getModel());
        agent.setTemperature(request.getTemperature());
        agent.setMaxTokens(request.getMaxTokens());
        agent.setIconUrl(request.getIconUrl());
        agent.setColorHex(request.getColorHex());
        agent.setIsActive(true);

        Agent savedAgent = agentRepository.save(agent);
        return mapToAgentResponse(savedAgent);
    }

    @Transactional
    public AgentResponse updateAgent(Long id, UpdateAgentRequest request) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found with id: " + id));

        agent.setName(request.getName());
        agent.setDomain(request.getDomain());
        agent.setDescription(request.getDescription());
        agent.setSystemPrompt(request.getSystemPrompt());
        agent.setModel(request.getModel());
        agent.setTemperature(request.getTemperature());
        agent.setMaxTokens(request.getMaxTokens());
        agent.setIsActive(request.getIsActive());
        agent.setIconUrl(request.getIconUrl());
        agent.setColorHex(request.getColorHex());

        Agent updatedAgent = agentRepository.save(agent);
        return mapToAgentResponse(updatedAgent);
    }

    @Transactional
    public AgentResponse toggleAgent(Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found with id: " + id));
        agent.setIsActive(!agent.getIsActive());
        Agent updatedAgent = agentRepository.save(agent);
        return mapToAgentResponse(updatedAgent);
    }

    @Transactional
    public void deleteAgent(Long id) {
        if (!agentRepository.existsById(id)) {
            throw new RuntimeException("Agent not found with id: " + id);
        }
        agentRepository.deleteById(id);
    }

    public AgentResponse mapToAgentResponse(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .domain(agent.getDomain())
                .description(agent.getDescription())
                .systemPrompt(agent.getSystemPrompt())
                .model(agent.getModel())
                .temperature(agent.getTemperature())
                .maxTokens(agent.getMaxTokens())
                .isActive(agent.getIsActive())
                .iconUrl(agent.getIconUrl())
                .colorHex(agent.getColorHex())
                .createdAt(agent.getCreatedAt())
                .build();
    }
}
