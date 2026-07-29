package com.omniflow.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ConversationCreatedEvent extends ApplicationEvent {
    private final String userId;
    private final String agentName;

    public ConversationCreatedEvent(Object source, String userId, String agentName) {
        super(source);
        this.userId = userId;
        this.agentName = agentName;
    }
}
