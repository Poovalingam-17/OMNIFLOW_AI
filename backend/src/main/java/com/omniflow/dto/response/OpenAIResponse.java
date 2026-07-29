package com.omniflow.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class OpenAIResponse {
    private List<Choice> choices;
    private Usage usage;

    @Data
    public static class Choice {
        private int index;
        private OpenAIMessage message;
        private String finishReason;
    }

    @Data
    public static class OpenAIMessage {
        private String role;
        private String content;
    }

    @Data
    public static class Usage {
        private int promptTokens;
        private int completionTokens;
        private int totalTokens;
    }
}
