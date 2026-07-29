package com.omniflow.config;

import com.omniflow.model.Role;
import com.omniflow.model.User;
import com.omniflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.omniflow.repository.AgentRepository agentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("admin@omniflow.com")) {
            User admin = User.builder()
                    .email("admin@omniflow.com")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .fullName("System Admin")
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Seeded system admin user: admin@omniflow.com / Admin@123");
        }

        if (agentRepository.count() == 0) {
            com.omniflow.model.Agent tutor = new com.omniflow.model.Agent();
            tutor.setAgentId("education-agent");
            tutor.setName("Personal Tutor Agent");
            tutor.setDomain("Education");
            tutor.setDescription("Explains programming concepts clearly, suggests study plans, and guides placement preparation.");
            tutor.setSystemPrompt("You are a Personal Tutor Agent. Teach clearly with practical coding examples.");
            tutor.setModel("gpt-4");
            tutor.setTemperature(0.7);
            tutor.setColorHex("#3b82f6");
            agentRepository.save(tutor);

            com.omniflow.model.Agent hr = new com.omniflow.model.Agent();
            hr.setAgentId("hr-agent");
            hr.setName("HR Assistant Agent");
            hr.setDomain("Human Resources");
            hr.setDescription("Guides onboarding steps, answers leave/payroll queries, and assists with company policies.");
            hr.setSystemPrompt("You are an HR Assistant Agent. Provide accurate policy instructions professionally.");
            hr.setModel("gpt-4");
            hr.setTemperature(0.6);
            hr.setColorHex("#22c55e");
            agentRepository.save(hr);

            com.omniflow.model.Agent health = new com.omniflow.model.Agent();
            health.setAgentId("healthcare-agent");
            health.setName("Healthcare Assistant Agent");
            health.setDomain("Healthcare");
            health.setDescription("Manages general appointment questions and wellness tips. Includes safety disclaimers.");
            health.setSystemPrompt("You are a Healthcare Assistant Agent. Advise with caring empathy. Disclaim that you are not a doctor.");
            health.setModel("gpt-4");
            health.setTemperature(0.5);
            health.setColorHex("#f43f5e");
            agentRepository.save(health);

            System.out.println("Seeded 3 default specialized agents in database.");
        }
    }
}
