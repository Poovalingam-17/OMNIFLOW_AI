package com.omniflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AgentResponse {
    private Long id;
    private String name;
    private String domain;
    private String description;
    private String systemPrompt;
    private String model;
    private Double temperature;
    private Integer maxTokens;
    private Boolean isActive;
    private String iconUrl;
    private String colorHex;
    private LocalDateTime createdAt;
}
