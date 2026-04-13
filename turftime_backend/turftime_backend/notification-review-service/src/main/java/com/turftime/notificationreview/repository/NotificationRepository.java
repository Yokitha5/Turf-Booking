package com.turftime.notificationreview.repository;

import com.turftime.notificationreview.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
}
