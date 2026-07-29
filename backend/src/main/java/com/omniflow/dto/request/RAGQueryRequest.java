package com.omniflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RAGQueryRequest {
    @NotBlank(message = "Question is required")
    private String question;
}
