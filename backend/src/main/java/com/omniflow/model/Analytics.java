package com.omniflow.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics")
@Data
public class Analytics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;
    
    private LocalDate date;
    private Integer totalQueries = 0;
    private Integer successfulQueries = 0;
    private Integer avgResponseTimeMs = 0;
    private Integer totalTokens = 0;
    private BigDecimal estimatedCost = BigDecimal.ZERO;
    private Double feedbackScore;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
