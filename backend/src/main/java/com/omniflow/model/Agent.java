package com.omniflow.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "agents")
@Data
public class Agent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "agent_id", unique = true, nullable = false)
    private String agentId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String domain;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String systemPrompt;
    
    private String model = "gpt-4";
    private Double temperature = 0.7;
    private Integer maxTokens = 2000;
    private Boolean isActive = true;
    private String iconUrl;
    private String colorHex;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
