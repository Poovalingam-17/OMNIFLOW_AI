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
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private String senderType;
    private String content;
    private Integer tokensUsed;
    private Integer responseTimeMs;
    private Boolean isRag;
    private String sources;
    private LocalDateTime createdAt;

    public static MessageResponse from(com.omniflow.model.Message message) {
        if (message == null) return null;
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderType(message.getSenderType().name())
                .content(message.getContent())
                .tokensUsed(message.getTokensUsed())
                .responseTimeMs(message.getResponseTimeMs())
                .isRag(message.getIsRag())
                .sources(message.getSources())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
