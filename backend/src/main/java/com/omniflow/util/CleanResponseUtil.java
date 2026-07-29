package com.omniflow.util;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

@Component
public class CleanResponseUtil {
    
    public String cleanAnswer(String rawAnswer) {
        if (rawAnswer == null || rawAnswer.isEmpty()) {
            return "I cannot find this information in the document.";
        }
        
        String cleaned = rawAnswer;
        
        // 1. Remove "ANSWER:" prefix
        cleaned = cleaned.replaceAll("(?i)^ANSWER\\s*[:]\\s*", "");
        
        // 2. Remove "Based on the document" prefixes
        cleaned = cleaned.replaceAll("(?i)^Based on (the )?(document|text|above).*?[:]\\s*", "");
        
        // 3. Remove "According to" prefixes
        cleaned = cleaned.replaceAll("(?i)^According to (the )?(document|text|above).*?[:]\\s*", "");
        
        // 4. Remove long dashes or equals signs (10 or more)
        cleaned = cleaned.replaceAll("[-=]{10,}", "");
        
        // 5. Remove numbering like "1.", "2." at start of lines
        cleaned = cleaned.replaceAll("(?m)^\\s*\\d+\\.\\s*", "");
        
        // 6. Remove section headers
        cleaned = cleaned.replaceAll("(?m)^SECTION\\s+\\d+.*$", "");
        cleaned = cleaned.replaceAll("(?m)^\\d+\\.\\d+\\s+[A-Za-z]+\\s+[A-Za-z]+\\s*$", "");
        
        // 7. Remove duplicate spaces
        cleaned = cleaned.replaceAll("\\s+", " ");
        
        // 8. Remove duplicate newlines
        cleaned = cleaned.replaceAll("\n{3,}", "\n\n");
        
        // 9. Trim whitespace
        cleaned = cleaned.trim();
        
        // 10. Ensure first letter is capital
        if (!cleaned.isEmpty()) {
            cleaned = Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
        }
        
        // 11. Remove trailing dashes or bullets
        cleaned = cleaned.replaceAll("[-•*]\\s*$", "");
        
        return cleaned;
    }
    
    public String cleanSourceContent(String content) {
        if (content == null) return "";
        
        return content
            .replaceAll("[-=]{10,}", "")
            .replaceAll("(?m)^\\s*\\d+\\.\\s*", "")
            .replaceAll("(?m)^SECTION\\s+\\d+.*$", "")
            .replaceAll("\\s+", " ")
            .trim();
    }
    
    public String formatAnswerWithPolicy(String answer, String policyName) {
        // If answer contains policy details, format nicely
        String formatted = answer;
        
        // Add policy name if not already present
        if (policyName != null && !formatted.toLowerCase().contains(policyName.toLowerCase())) {
            formatted = policyName + ": " + formatted;
        }
        
        // Ensure proper punctuation
        if (!formatted.endsWith(".") && !formatted.endsWith("!") && !formatted.endsWith("?")) {
            formatted = formatted + ".";
        }
        
        return formatted;
    }
    
    public String extractPolicyDetails(String answer) {
        // Extract bullet points or key details
        StringBuilder details = new StringBuilder();
        String[] lines = answer.split("\n");
        
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                details.append(trimmed).append("\n");
            }
        }
        
        return details.toString().trim();
    }
}
