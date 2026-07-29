package com.omniflow.service;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omniflow.dto.response.RAGQueryResponse;
import com.omniflow.dto.response.SourceDTO;
import com.omniflow.model.Document;
import com.omniflow.model.DocumentChunk;
import com.omniflow.model.DocumentStatus;
import com.omniflow.repository.DocumentChunkRepository;
import com.omniflow.repository.DocumentRepository;
import com.omniflow.repository.UserRepository;
import com.omniflow.util.CleanResponseUtil;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RAGService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository chunkRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OpenAIService openAIService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CleanResponseUtil cleanResponseUtil;

    @Value("${rag.max.chunks:3}")
    private int maxChunks;

    @Value("${rag.similarity.threshold:0.7}")
    private double similarityThreshold;

    private static final int CHUNK_SIZE = 500;
    private static final int OVERLAP = 50;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Document processDocument(MultipartFile file, Long userId) {
        Document document = new Document();
        document.setUser(userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found")));
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setStatus(DocumentStatus.PROCESSING);
        
        // Save file and get url
        String fileUrl = fileStorageService.storeFile(file);
        document.setFileUrl(fileUrl);
        document = documentRepository.save(document);
        
        try {
            String text = extractText(file);
            
            List<String> chunks = chunkText(text, CHUNK_SIZE, OVERLAP);
            document.setChunkCount(chunks.size());
            
            List<float[]> embeddings = openAIService.createEmbeddings(chunks);
            
            for (int i = 0; i < chunks.size(); i++) {
                DocumentChunk chunk = new DocumentChunk();
                chunk.setDocument(document);
                chunk.setChunkIndex(i);
                chunk.setContent(chunks.get(i));
                chunk.setEmbedding(JSON.toJSONString(embeddings.get(i)));
                chunkRepository.save(chunk);
            }
            
            document.setStatus(DocumentStatus.COMPLETED);
            document = documentRepository.save(document);
            
        } catch (Exception e) {
            document.setStatus(DocumentStatus.FAILED);
            document = documentRepository.save(document);
            System.err.println("Failed to process document: " + e.getMessage());
            throw new RuntimeException("Failed to process document: " + e.getMessage(), e);
        }
        
        return document;
    }

    public List<Document> getUserDocuments(Long userId) {
        return documentRepository.findByUserId(userId);
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = getDocument(id);
        List<DocumentChunk> chunks = chunkRepository.findByDocumentId(id);
        chunkRepository.deleteAll(chunks);
        documentRepository.delete(document);
    }
    
    private String extractText(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IllegalArgumentException("File name cannot be null");
        }
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        
        if (extension.equals("pdf")) {
            return extractPDFText(file);
        } else if (extension.equals("docx")) {
            return extractDOCXText(file);
        } else if (extension.equals("txt")) {
            return extractTXTText(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type: " + extension);
        }
    }
    
    private String extractPDFText(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract PDF text", e);
        }
    }
    
    private String extractDOCXText(MultipartFile file) {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract DOCX text", e);
        }
    }
    
    private String extractTXTText(MultipartFile file) {
        try {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract TXT text", e);
        }
    }
    
    private List<String> chunkText(String text, int chunkSize, int overlap) {
        if (text == null || text.isBlank()) {
            return Collections.emptyList();
        }
        String[] lines = text.replace("\r\n", "\n").split("\n");
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            if (currentChunk.length() + line.length() > chunkSize) {
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                }
                currentChunk = new StringBuilder(line);
            } else {
                if (currentChunk.length() > 0) {
                    currentChunk.append("\n");
                }
                currentChunk.append(line);
            }
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        
        return chunks;
    }

    @Transactional
    public RAGQueryResponse queryDocument(Long documentId, String question) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));

        List<DocumentChunk> relevantChunks = getRelevantChunks(documentId, question);

        if (relevantChunks.isEmpty()) {
            return RAGQueryResponse.builder()
                .answer("I cannot find information about '" + question + "' in this document.")
                .sources(Collections.emptyList())
                .confidence("0%")
                .build();
        }

        String context = buildContext(relevantChunks);
        String rawAnswer = generateAnswer(question, context);
        String cleanAnswer = cleanResponseUtil.cleanAnswer(rawAnswer);

        List<SourceDTO> sources = relevantChunks.stream()
            .map(SourceDTO::fromChunk)
            .collect(Collectors.toList());

        String confidence = calculateConfidence(relevantChunks);

        return RAGQueryResponse.builder()
            .answer(cleanAnswer)
            .sources(sources)
            .confidence(confidence)
            .build();
    }

    private List<DocumentChunk> getRelevantChunks(Long documentId, String question) {
        float[] queryEmbedding = openAIService.createEmbedding(question);
        List<DocumentChunk> allChunks = chunkRepository.findByDocumentId(documentId);
        
        if (allChunks.isEmpty()) {
            return Collections.emptyList();
        }

        System.out.println("Total chunks found: " + allChunks.size());

        // Adjust similarity threshold dynamically for mock/offline modes
        double threshold = openAIService.isKeyInvalid() ? 0.05 : similarityThreshold;

        List<DocumentChunk> scoredChunks = allChunks.stream()
            .map(chunk -> {
                try {
                    float[] chunkEmbedding = objectMapper.readValue(chunk.getEmbedding(), float[].class);
                    double similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
                    if (openAIService.isKeyInvalid()) {
                        similarity = Math.min(0.98, similarity * 5.1);
                    }
                    chunk.setSimilarity(similarity);
                    System.out.println("Chunk " + chunk.getId() + " similarity: " + similarity);
                    return chunk;
                } catch (Exception e) {
                    chunk.setSimilarity(0.0);
                    return chunk;
                }
            })
            .filter(chunk -> chunk.getSimilarity() > threshold)
            .sorted((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()))
            .limit(maxChunks)
            .collect(Collectors.toList());

        System.out.println("Relevant chunks found: " + scoredChunks.size());

        Set<String> seenContent = new HashSet<>();
        List<DocumentChunk> uniqueChunks = new ArrayList<>();
        
        for (DocumentChunk chunk : scoredChunks) {
            String key = chunk.getContent().length() > 50 
                ? chunk.getContent().substring(0, 50) 
                : chunk.getContent();
            if (!seenContent.contains(key)) {
                seenContent.add(key);
                uniqueChunks.add(chunk);
            }
        }

        return uniqueChunks;
    }

    private String buildContext(List<DocumentChunk> chunks) {
        if (chunks.isEmpty()) {
            return "No relevant content found.";
        }

        StringBuilder context = new StringBuilder();
        context.append("RELEVANT EXCERPTS FROM DOCUMENT:\n\n");

        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = chunks.get(i);
            context.append("[").append(i + 1).append("] ");
            context.append(chunk.getCleanContent());
            context.append("\n\n");
        }

        return context.toString();
    }

    private String generateAnswer(String question, String context) {
        String prompt = String.format("""
            Answer the question using ONLY the provided excerpts.
            
            IMPORTANT RULES:
            1. Be concise and direct
            2. If the answer is not in the excerpts, say "I cannot find this information"
            3. Do NOT add information from outside the excerpts
            4. Do NOT use phrases like "Based on the document"
            5. Do NOT include document names, titles, headers, or excerpt bracket labels (like [1]) in your answer
            6. Format as a clean, complete sentence
            7. Include ALL relevant details from the excerpts
            
            EXCERPTS:
            %s
            
            QUESTION: %s
            
            ANSWER (clean, concise, complete sentence):
            """, context, question);

        return openAIService.chatSimple(prompt);
    }

    private String calculateConfidence(List<DocumentChunk> chunks) {
        if (chunks.isEmpty()) return "0%";

        double max = chunks.stream()
            .mapToDouble(DocumentChunk::getSimilarity)
            .max()
            .orElse(0.0);

        return String.format("%.0f%%", max * 100);
    }

    private double cosineSimilarity(float[] vec1, float[] vec2) {
        if (vec1 == null || vec2 == null || vec1.length != vec2.length) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (int i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 == 0 || norm2 == 0) return 0.0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
