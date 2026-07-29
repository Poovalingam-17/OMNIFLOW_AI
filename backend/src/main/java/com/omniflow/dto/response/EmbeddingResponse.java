package com.omniflow.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class EmbeddingResponse {
    private String object;
    private List<EmbeddingData> data;
    private Usage usage;

    @Data
    public static class EmbeddingData {
        private String object;
        private int index;
        private float[] embedding;
    }

    @Data
    public static class Usage {
        private int promptTokens;
        private int totalTokens;
    }
}
