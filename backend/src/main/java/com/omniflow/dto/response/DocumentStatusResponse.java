package com.omniflow.dto.response;

import com.omniflow.model.Document;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentStatusResponse {
    private Long id;
    private String status;
    private Integer chunkCount;

    public static DocumentStatusResponse from(Document doc) {
        if (doc == null) return null;
        return DocumentStatusResponse.builder()
                .id(doc.getId())
                .status(doc.getStatus().name())
                .chunkCount(doc.getChunkCount())
                .build();
    }
}
