package com.bridgeai.portal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

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
        status.put("service", "BridgeAI Training & Examination Portal");

        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(3);
            status.put("databaseConnected", valid);
            status.put("databaseCatalog", conn.getCatalog());
            status.put("databaseProduct", conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion());
            status.put("database", "Aiven MySQL Cloud (Connected)");
        } catch (Exception e) {
            status.put("databaseConnected", false);
            status.put("databaseError", e.getMessage());
            status.put("database", "Disconnected / Error: " + e.getMessage());
        }

        return ResponseEntity.ok(status);
    }
}
