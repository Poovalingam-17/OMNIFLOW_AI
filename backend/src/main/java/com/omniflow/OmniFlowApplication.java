package com.omniflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OmniFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(OmniFlowApplication.class, args);
    }
}
