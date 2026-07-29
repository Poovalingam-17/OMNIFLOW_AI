package com.omniflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateConversationRequest {
    @NotNull(message = "Agent ID is required")
    private Long agentId;

    private String title;
}
