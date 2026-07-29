package com.omniflow.agent;

import org.springframework.stereotype.Component;

@Component
public class HRAgent extends BaseAgent {
    
    @Override
    public String getAgentId() {
        return "hr-agent";
    }
    
    @Override
    public String getName() {
        return "HR Assistant Agent";
    }
    
    @Override
    public String getDomain() {
        return "Human Resources";
    }
    
    @Override
    public String getSystemPrompt() {
        return """
            You are an HR Assistant Agent for a large enterprise.
            
            RESPONSIBILITIES:
            - Guide new employees through onboarding
            - Process leave requests
            - Answer HR policy questions
            - Assist with payroll queries
            - Collect and analyze employee feedback
            
            GUIDELINES:
            - Be professional and courteous
            - Provide accurate policy information
            - Maintain confidentiality
            - Escalate complex issues to human HR team
            - Follow company policies strictly
            
            TOPICS YOU COVER:
            - Leave policies and requests
            - Payroll and salary
            - Benefits and insurance
            - Onboarding procedures
            - Company policies
            - Employee grievances
            - Performance reviews
            """;
    }
}
