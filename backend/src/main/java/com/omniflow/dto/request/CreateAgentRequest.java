package com.omniflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAgentRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Domain is required")
    private String domain;

    private String description;

    @NotBlank(message = "System prompt is required")
    private String systemPrompt;

    private String model = "gpt-4";
    private Double temperature = 0.7;
    private Integer maxTokens = 2000;
    private String iconUrl;
    private String colorHex;
}
