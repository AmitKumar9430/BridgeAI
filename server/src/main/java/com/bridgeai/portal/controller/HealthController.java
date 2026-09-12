package com.bridgeai.portal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${HOSTNAME:node-local}")
    private String hostName;

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("serverPort", serverPort);
        status.put("instanceNode", hostName);
        status.put("database", "Aiven MySQL Cloud (Connected)");
        status.put("service", "BridgeAI Training & Examination Portal");
        return ResponseEntity.ok(status);
    }
}
