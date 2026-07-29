package com.omniflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UsageStats {
    private long totalTokens;
    private BigDecimal estimatedCost;
    private Map<String, Long> queriesByAgent;
}
