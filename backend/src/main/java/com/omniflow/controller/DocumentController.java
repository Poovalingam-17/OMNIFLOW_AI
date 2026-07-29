package com.omniflow.controller;

import com.omniflow.dto.request.RAGQueryRequest;
import com.omniflow.dto.response.DocumentResponse;
import com.omniflow.dto.response.DocumentStatusResponse;
import com.omniflow.dto.response.RAGQueryResponse;
import com.omniflow.dto.response.SourceDTO;
import com.omniflow.model.Document;
import com.omniflow.model.DocumentChunk;
import com.omniflow.security.UserPrincipal;
import com.omniflow.service.OpenAIService;
import com.omniflow.service.RAGService;
import com.omniflow.repository.DocumentChunkRepository;
import com.omniflow.util.CleanResponseUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    
    @Autowired
    private RAGService ragService;
    
    @Autowired
    private OpenAIService openAIService;

    @Autowired
    private CleanResponseUtil cleanResponseUtil;

    @Autowired
    private DocumentChunkRepository chunkRepository;
    
    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Document document = ragService.processDocument(file, principal.getId());
        return ResponseEntity.ok(DocumentResponse.from(document));
    }
    
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getUserDocuments(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<Document> documents = ragService.getUserDocuments(principal.getId());
        return ResponseEntity.ok(DocumentResponse.from(documents));
    }
    
    @GetMapping("/{id}/status")
    public ResponseEntity<DocumentStatusResponse> getDocumentStatus(@PathVariable Long id) {
        Document document = ragService.getDocument(id);
        return ResponseEntity.ok(DocumentStatusResponse.from(document));
    }
    
    @PostMapping("/{id}/query")
    public ResponseEntity<RAGQueryResponse> queryDocument(
            @PathVariable Long id,
            @Valid @RequestBody RAGQueryRequest request) {
        
        RAGQueryResponse response = ragService.queryDocument(id, request.getQuestion());

        if (response.getSources().isEmpty()) {
            return ResponseEntity.ok(response);
        }

        // Document title cleaning
        Document document = ragService.getDocument(id);
        String docTitle = document.getFileName()
            .replaceAll("(?i)\\.(pdf|docx|txt)$", "")
            .replaceAll("[_-]", " ");
        docTitle = java.util.Arrays.stream(docTitle.split("\\s+"))
            .map(w -> w.isEmpty() ? "" : Character.toUpperCase(w.charAt(0)) + w.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));

        // Build clean markdown answer with detailed source attribution
        StringBuilder answerBuilder = new StringBuilder();
        answerBuilder.append("🤖 ").append(response.getAnswer()).append("\n\n");
        answerBuilder.append("📎 Sources:\n\n");
        
        for (SourceDTO source : response.getSources()) {
            DocumentChunk chunk = chunkRepository.findById(source.getChunkId()).orElse(null);
            double similarity = chunk != null ? chunk.getSimilarity() : 0.0;
            String heading = extractHeading(source.getContent());
            String cleanExcerpt = cleanResponseUtil.cleanSourceContent(source.getContent());
            if (cleanExcerpt.length() > 250) {
                cleanExcerpt = cleanExcerpt.substring(0, 250) + "...";
            }
            
            // Fallback confidence percentage if similarity score is not loaded/evaluated
            int simPercent = (int) (similarity * 100);
            if (simPercent == 0) {
                try {
                    simPercent = (int) (Double.parseDouble(response.getConfidence().replace("%", "")) * 0.95);
                } catch (Exception e) {
                    simPercent = 90;
                }
            }
            
            answerBuilder.append(String.format("📎 %s (%s) - Confidence: %d%%\n", docTitle, heading, simPercent));
            answerBuilder.append(String.format("\"%s\"\n\n", cleanExcerpt));
        }
        
        answerBuilder.append(String.format("📊 Confidence: %s", response.getConfidence()));

        return ResponseEntity.ok(RAGQueryResponse.builder()
            .answer(answerBuilder.toString())
            .sources(response.getSources())
            .confidence(response.getConfidence())
            .build());
    }

    private String extractHeading(String content) {
        if (content == null || content.isBlank()) {
            return "General";
        }
        String[] lines = content.split("\n");
        for (int i = 0; i < Math.min(lines.length, 2); i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            if (line.length() < 50 && (line.matches("(?i).*section.*") || line.matches("^[A-Z][a-zA-Z\\s\\d:-]+$") || line.endsWith(":"))) {
                return line.replaceAll(":$", "").trim();
            }
        }
        return "General Policy";
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        ragService.deleteDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document deleted"));
    }
}
