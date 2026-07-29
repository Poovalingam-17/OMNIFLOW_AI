package com.omniflow.controller;

import com.omniflow.dto.request.CreateAgentRequest;
import com.omniflow.dto.request.UpdateAgentRequest;
import com.omniflow.dto.response.AgentResponse;
import com.omniflow.service.AgentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
public class AgentController {
    
    @Autowired
    private AgentService agentService;
    
    @GetMapping
    public ResponseEntity<List<AgentResponse>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AgentResponse> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getAgentById(id));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.createAgent(request));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> updateAgent(@PathVariable Long id, @Valid @RequestBody UpdateAgentRequest request) {
        return ResponseEntity.ok(agentService.updateAgent(id, request));
    }
    
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> toggleAgent(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.toggleAgent(id));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.ok(Map.of("message", "Agent deleted successfully"));
    }
}
