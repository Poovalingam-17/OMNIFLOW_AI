package com.omniflow.dto.response;

import com.omniflow.model.Document;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class DocumentResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private Integer chunkCount;
    private String status;
    private LocalDateTime createdAt;

    public static DocumentResponse from(Document doc) {
        if (doc == null) return null;
        return DocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .chunkCount(doc.getChunkCount())
                .status(doc.getStatus().name())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    public static List<DocumentResponse> from(List<Document> docs) {
        if (docs == null) return null;
        return docs.stream().map(DocumentResponse::from).collect(Collectors.toList());
    }
}
