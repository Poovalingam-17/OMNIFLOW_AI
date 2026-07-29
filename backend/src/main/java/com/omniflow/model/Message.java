package com.omniflow.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @Enumerated(EnumType.STRING)
    private SenderType senderType;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    private Integer tokensUsed = 0;
    private Integer responseTimeMs = 0;
    private Boolean isRag = false;
    
    @Column(columnDefinition = "TEXT")
    private String sources;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
}
