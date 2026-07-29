package com.omniflow.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_chunks")
@Data
public class DocumentChunk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    private Integer chunkIndex;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(columnDefinition = "TEXT")
    private String embedding;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Transient
    private double similarity;

    public String getCleanContent() {
        return content != null ? content.trim() : "";
    }
}
