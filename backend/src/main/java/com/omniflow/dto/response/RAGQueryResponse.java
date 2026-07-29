package com.omniflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RAGQueryResponse {
    private String answer;
    private List<SourceDTO> sources;
    private String confidence;
}
