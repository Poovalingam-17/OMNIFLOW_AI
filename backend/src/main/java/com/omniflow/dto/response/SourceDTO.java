package com.omniflow.dto.response;

import com.omniflow.model.DocumentChunk;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SourceDTO {
    private Long chunkId;
    private String content;

    public static SourceDTO fromChunk(DocumentChunk chunk) {
        if (chunk == null) return null;
        return SourceDTO.builder()
            .chunkId(chunk.getId())
            .content(chunk.getCleanContent())
            .build();
    }
}
