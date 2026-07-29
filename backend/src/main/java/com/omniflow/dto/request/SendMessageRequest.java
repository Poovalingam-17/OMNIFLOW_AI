package com.omniflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Content is required")
    private String content;
    
    private String imageBase64;
}
