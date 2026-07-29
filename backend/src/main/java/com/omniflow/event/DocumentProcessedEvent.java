package com.omniflow.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DocumentProcessedEvent extends ApplicationEvent {
    private final String userId;
    private final String fileName;

    public DocumentProcessedEvent(Object source, String userId, String fileName) {
        super(source);
        this.userId = userId;
        this.fileName = fileName;
    }
}
