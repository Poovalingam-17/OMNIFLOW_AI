package com.omniflow.service;

import com.omniflow.dto.response.OpenAIResponse;
import com.omniflow.dto.response.EmbeddingResponse;
import com.omniflow.model.Message;
import com.omniflow.model.SenderType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.*;

@Service
public class OpenAIService {
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.model}")
    private String model;
    
    @Value("${openai.temperature}")
    private double temperature;
    
    @Value("${openai.max-tokens}")
    private int maxTokens;
    
    private final RestTemplate restTemplate;
    private WebClient webClient;
    
    public OpenAIService() {
        this.restTemplate = new RestTemplate();
    }

    public boolean isKeyInvalid() {
        return apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("$") || apiKey.equals("mock-key") || apiKey.contains("YOUR_API_KEY");
    }
    
    public OpenAIResponse chat(String systemPrompt, String userMessage, List<Message> history) {
        if (isKeyInvalid()) {
            return getFallbackResponse(systemPrompt, userMessage);
        }
        
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            
            for (Message msg : history) {
                String role = msg.getSenderType() == SenderType.USER ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg.getContent()));
            }
            
            messages.add(Map.of("role", "user", "content", userMessage));
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", model);
            request.put("messages", messages);
            request.put("temperature", temperature);
            request.put("max_tokens", maxTokens);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<OpenAIResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                OpenAIResponse.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            System.err.println("OpenAI API call failed, falling back to mock reply: " + e.getMessage());
            return getFallbackResponse(systemPrompt, userMessage);
        }
    }
    
    public Flux<String> chatStream(String systemPrompt, String userMessage, List<Message> history) {
        if (isKeyInvalid()) {
            return getFallbackStream(systemPrompt, userMessage);
        }
        
        try {
            if (this.webClient == null) {
                this.webClient = WebClient.builder().baseUrl("https://api.openai.com/v1").build();
            }
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            for (Message msg : history) {
                String role = msg.getSenderType() == SenderType.USER ? "user" : "assistant";
                messages.add(Map.of("role", role, "content", msg.getContent()));
            }
            messages.add(Map.of("role", "user", "content", userMessage));
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", model);
            request.put("messages", messages);
            request.put("temperature", temperature);
            request.put("max_tokens", maxTokens);
            request.put("stream", true);
            
            return this.webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(line -> !line.trim().equals("[DONE]"))
                    .map(line -> {
                        try {
                            if (line.contains("\"content\":\"")) {
                                int start = line.indexOf("\"content\":\"") + 11;
                                int end = line.indexOf("\"", start);
                                String content = line.substring(start, end);
                                return content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
                            }
                        } catch (Exception ignored) {}
                        return "";
                    })
                    .onErrorResume(e -> {
                        System.err.println("OpenAI Streaming failed, falling back: " + e.getMessage());
                        return getFallbackStream(systemPrompt, userMessage);
                    });
        } catch (Exception e) {
            System.err.println("OpenAI Streaming creation failed, falling back: " + e.getMessage());
            return getFallbackStream(systemPrompt, userMessage);
        }
    }
    
    private OpenAIResponse getFallbackResponse(String systemPrompt, String userMessage) {
        OpenAIResponse response = new OpenAIResponse();
        OpenAIResponse.Choice choice = new OpenAIResponse.Choice();
        OpenAIResponse.OpenAIMessage msg = new OpenAIResponse.OpenAIMessage();
        
        String content = generateMockAnswer(systemPrompt, userMessage);
        msg.setRole("assistant");
        msg.setContent(content);
        
        choice.setIndex(0);
        choice.setMessage(msg);
        choice.setFinishReason("stop");
        
        OpenAIResponse.Usage usage = new OpenAIResponse.Usage();
        usage.setPromptTokens(userMessage.length() / 4);
        usage.setCompletionTokens(content.length() / 4);
        usage.setTotalTokens(usage.getPromptTokens() + usage.getCompletionTokens());
        
        response.setChoices(Collections.singletonList(choice));
        response.setUsage(usage);
        return response;
    }
    
    private Flux<String> getFallbackStream(String systemPrompt, String userMessage) {
        String content = generateMockAnswer(systemPrompt, userMessage);
        String[] words = content.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(words)
                .delayElements(Duration.ofMillis(60));
    }
    
    private String generateMockAnswer(String systemPrompt, String userMessage) {
        String promptLower = systemPrompt.toLowerCase();
        String msgLower = userMessage.toLowerCase();
        
        if (promptLower.contains("tutor")) {
            if (msgLower.contains("recursion")) {
                return "Recursion is a programming concept where a method calls itself to solve a smaller instance of the same problem.\n\nHere is a simple example in Java for calculating factorial:\n```java\npublic int factorial(int n) {\n    if (n <= 1) return 1; // Base case\n    return n * factorial(n - 1); // Recursive call\n}\n```\nDo you have any specific question on recursion that we should trace together?";
            }
            return "Hello! I am your Personal Tutor Agent. Let's study programming concepts, algorithms, or system design. What topic would you like to review today?";
        } else if (promptLower.contains("hr assistant") || promptLower.contains("human resources")) {
            if (msgLower.contains("leave") || msgLower.contains("vacation")) {
                return "Under company policy, full-time employees are allocated 25 days of annual leave. Leave requests must be submitted through the Employee Portal and approved by your manager at least 5 business days in advance.";
            }
            return "Hello! I am your HR Assistant Agent. I can help guide you through onboarding, leave request procedures, payroll FAQs, or general policy inquiries. Please let me know how I can help.";
        } else if (promptLower.contains("healthcare")) {
            if (msgLower.contains("flu") || msgLower.contains("fever")) {
                return "[DISCLAIMER: I am an AI assistant and not a medical doctor. Consult a physician for accurate diagnosis.]\n\nCommon flu symptoms include sudden fever, muscle aches, chills, fatigue, and dry cough. Rest, hydration, and over-the-counter pain relievers are generally advised, but please consult a healthcare professional if symptoms worsen.";
            }
            return "[DISCLAIMER: I am an AI assistant and not a medical doctor. Always consult a healthcare professional for serious queries.]\n\nI can help book appointments, summarize general medical reports, or provide wellness reminders. How can I assist you with general hospital details today?";
        }
        
        return "I am your virtual assistant. I received your message: \"" + userMessage + "\". Please let me know how I can help you.";
    }

    public float[] createEmbedding(String text) {
        if (isKeyInvalid()) {
            return generateMockEmbedding(text);
        }
        
        try {
            String url = "https://api.openai.com/v1/embeddings";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", "text-embedding-ada-002");
            request.put("input", text);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<EmbeddingResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                EmbeddingResponse.class
            );
            
            return response.getBody().getData().get(0).getEmbedding();
        } catch (Exception e) {
            System.err.println("createEmbedding failed, falling back: " + e.getMessage());
            return generateMockEmbedding(text);
        }
    }
    
    public List<float[]> createEmbeddings(List<String> texts) {
        if (isKeyInvalid()) {
            List<float[]> list = new ArrayList<>();
            for (String text : texts) {
                list.add(generateMockEmbedding(text));
            }
            return list;
        }
        
        try {
            String url = "https://api.openai.com/v1/embeddings";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", "text-embedding-ada-002");
            request.put("input", texts);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<EmbeddingResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                EmbeddingResponse.class
            );
            
            List<float[]> list = new ArrayList<>();
            for (EmbeddingResponse.EmbeddingData data : response.getBody().getData()) {
                list.add(data.getEmbedding());
            }
            return list;
        } catch (Exception e) {
            System.err.println("createEmbeddings failed, falling back: " + e.getMessage());
            List<float[]> list = new ArrayList<>();
            for (String text : texts) {
                list.add(generateMockEmbedding(text));
            }
            return list;
        }
    }

    public String chatSimple(String prompt) {
        if (isKeyInvalid()) {
            return generateMockSimpleAnswer(prompt);
        }
        
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", model);
            request.put("messages", Collections.singletonList(Map.of("role", "user", "content", prompt)));
            request.put("temperature", 0.3);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<OpenAIResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                OpenAIResponse.class
            );
            
            return response.getBody().getChoices().get(0).getMessage().getContent();
        } catch (Exception e) {
            System.err.println("chatSimple failed, falling back: " + e.getMessage());
            return generateMockSimpleAnswer(prompt);
        }
    }

    private float[] generateMockEmbedding(String text) {
        // Keyword-frequency based embedding: chunks sharing words with the query
        // will have higher cosine similarity, making retrieval meaningful offline.
        float[] vector = new float[1536];
        if (text == null || text.isBlank()) return vector;

        String normalized = text.toLowerCase().replaceAll("[^a-z0-9\\s]", "");
        String[] words = normalized.split("\\s+");

        // Hash each word to a stable bucket in [0, 1535] and accumulate frequency
        for (String word : words) {
            if (word.length() < 2) continue;
            int bucket = (word.hashCode() & 0x7FFFFFFF) % 1536;
            vector[bucket] += 1.0f;
        }

        // L2-normalize so cosine similarity works correctly
        double sumSquare = 0;
        for (float v : vector) sumSquare += v * v;
        if (sumSquare > 0) {
            float norm = (float) Math.sqrt(sumSquare);
            for (int i = 0; i < 1536; i++) vector[i] /= norm;
        }
        return vector;
    }

    private String generateMockSimpleAnswer(String prompt) {
        try {
            String promptLower = prompt.toLowerCase();
            int contextIdx = promptLower.indexOf("context:");
            if (contextIdx == -1) {
                contextIdx = promptLower.indexOf("excerpts:");
            }
            int questionIdx = promptLower.indexOf("question:");
            int answerIdx = promptLower.indexOf("answer:");
            
            if (contextIdx != -1 && questionIdx != -1) {
                int labelLength = promptLower.startsWith("context:", contextIdx) ? 8 : 9;
                String context = prompt.substring(contextIdx + labelLength, questionIdx).trim();
                String question = prompt.substring(questionIdx + 9, answerIdx != -1 ? answerIdx : prompt.length()).trim().toLowerCase();
                
                // Split by double newline (paragraphs) first, fallback to single newlines if double newlines are not present
                String[] paragraphs = context.contains("\n\n") ? context.split("\n\n") : context.split("\n");
                String bestMatch = null;
                int maxMatches = 0;
                
                String[] questionWords = question.split("\\s+");
                for (String paragraph : paragraphs) {
                    paragraph = paragraph.trim();
                    if (paragraph.isEmpty()) continue;
                    
                    int matches = 0;
                    String paragraphLower = paragraph.toLowerCase();
                    for (String word : questionWords) {
                        if (word.length() > 3 && paragraphLower.contains(word)) {
                            matches++;
                        }
                    }
                    if (matches > maxMatches) {
                        maxMatches = matches;
                        bestMatch = paragraph;
                    }
                }
                
                if (bestMatch != null && maxMatches > 0) {
                    return bestMatch.trim();
                }
            }
        } catch (Exception ignored) {}
        
        return "I cannot find the answer in the document.";
    }
}
