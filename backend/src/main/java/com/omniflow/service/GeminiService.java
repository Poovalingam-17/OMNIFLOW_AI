package com.omniflow.service;

import com.omniflow.model.Message;
import com.omniflow.model.SenderType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.temperature:0.7}")
    private double temperature;

    @Value("${gemini.max-output-tokens:2000}")
    private int maxOutputTokens;

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final RestTemplate restTemplate = new RestTemplate();

    private boolean isKeyInvalid() {
        return apiKey == null || apiKey.isBlank() || apiKey.startsWith("${");
    }

    /**
     * Send a chat message to Gemini and return the text response.
     */
    public String chat(String systemPrompt, String userMessage, List<Message> history, String imageBase64) {
        if (isKeyInvalid()) {
            return getFallbackResponse(systemPrompt, userMessage);
        }

        try {
            String url = BASE_URL + model + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Build contents array from history + current message
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add conversation history
            for (Message msg : history) {
                String role = msg.getSenderType() == SenderType.USER ? "user" : "model";
                Map<String, Object> content = new HashMap<>();
                content.put("role", role);
                content.put("parts", List.of(Map.of("text", msg.getContent())));
                contents.add(content);
            }

            // Add current user message
            Map<String, Object> userContent = new HashMap<>();
            userContent.put("role", "user");
            
            List<Map<String, Object>> userParts = new ArrayList<>();
            userParts.add(Map.of("text", userMessage));
            
            if (imageBase64 != null && !imageBase64.isEmpty()) {
                String mimeType = "image/png";
                String base64Data = imageBase64;
                if (imageBase64.contains(";base64,")) {
                    String[] dataParts = imageBase64.split(";base64,");
                    mimeType = dataParts[0].replace("data:", "");
                    base64Data = dataParts[1];
                }
                
                userParts.add(Map.of("inlineData", Map.of(
                    "mimeType", mimeType,
                    "data", base64Data
                )));
            }
            
            userContent.put("parts", userParts);
            contents.add(userContent);

            // Build system instruction
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", systemPrompt)));

            // Build generation config
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", temperature);
            generationConfig.put("maxOutputTokens", maxOutputTokens);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("systemInstruction", systemInstruction);
            requestBody.put("contents", contents);
            requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Parse response
            Map body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map> candidates = (List<Map>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map content = (Map) candidates.get(0).get("content");
                    List<Map> parts = (List<Map>) content.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }

            return getFallbackResponse(systemPrompt, userMessage);

        } catch (Exception e) {
            System.err.println("[GeminiService] API call failed: " + e.getMessage());
            return getFallbackResponse(systemPrompt, userMessage);
        }
    }

    public String chat(String systemPrompt, String userMessage, List<Message> history) {
        return chat(systemPrompt, userMessage, history, null);
    }

    /**
     * Streaming version — calls Gemini REST API synchronously, then emits
     * the response word-by-word so the frontend sees a live typing effect.
     */
    public Flux<String> chatStream(String systemPrompt, String userMessage, List<Message> history) {
        // Get full response first
        String fullResponse = chat(systemPrompt, userMessage, history);

        // Emit word-by-word with a small delay for the streaming typing effect
        String[] tokens = fullResponse.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(tokens)
                   .delayElements(Duration.ofMillis(30))
                   .onErrorResume(e -> {
                       System.err.println("[GeminiService] Stream emit failed: " + e.getMessage());
                       return getFallbackStream(userMessage);
                   });
    }

    // ---- Fallback helpers ----

    private String getFallbackResponse(String systemPrompt, String userMessage) {
        String promptLower = systemPrompt != null ? systemPrompt.toLowerCase() : "";
        String msgLower = userMessage != null ? userMessage.toLowerCase() : "";

        if (promptLower.contains("tutor") || promptLower.contains("education")) {
            return "Hello! I'm your Education Tutor. I can help you with programming concepts, algorithms, and more. What would you like to learn today?";
        } else if (promptLower.contains("hr") || promptLower.contains("human resources")) {
            return "Hello! I'm your HR Assistant. I can help with leave policies, onboarding, payroll FAQs, and general HR queries.";
        } else if (promptLower.contains("healthcare") || promptLower.contains("medical")) {
            return "[Note: I'm an AI assistant, not a medical doctor.] I can help with general wellness information and appointment guidance.";
        }
        return "I received your message: \"" + userMessage + "\". How can I assist you further?";
    }

    private Flux<String> getFallbackStream(String userMessage) {
        String content = "I received your message: \"" + userMessage + "\". How can I assist you further?";
        String[] words = content.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(words).delayElements(Duration.ofMillis(50));
    }
}
