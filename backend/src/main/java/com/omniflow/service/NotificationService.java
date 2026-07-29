package com.omniflow.service;

import com.omniflow.dto.response.Notification;
import com.omniflow.event.ConversationCreatedEvent;
import com.omniflow.event.DocumentProcessedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotification(String userId, Notification notification) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
    }

    @EventListener
    public void handleConversationCreated(ConversationCreatedEvent event) {
        Notification notification = Notification.builder()
            .type("CONVERSATION_CREATED")
            .title("New Conversation Started")
            .body("You started a conversation with " + event.getAgentName())
            .timestamp(LocalDateTime.now())
            .build();
        sendNotification(event.getUserId(), notification);
    }

    @EventListener
    public void handleDocumentProcessed(DocumentProcessedEvent event) {
        Notification notification = Notification.builder()
            .type("DOCUMENT_PROCESSED")
            .title("Document Processing Complete")
            .body("Your document '" + event.getFileName() + "' is ready for querying")
            .timestamp(LocalDateTime.now())
            .build();
        sendNotification(event.getUserId(), notification);
    }
}
