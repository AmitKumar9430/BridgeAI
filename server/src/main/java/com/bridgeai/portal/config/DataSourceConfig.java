package com.bridgeai.portal.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        log.info("Testing connection to primary database: {}", dbUrl);
        boolean aivenConnected = false;

        try {
            DriverManager.setLoginTimeout(3);
            try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
                if (conn.isValid(3)) {
                    aivenConnected = true;
                    log.info("Successfully authenticated and connected to primary Aiven Cloud MySQL!");
                }
            }
        } catch (Exception ex) {
            log.warn("Notice: Primary Aiven MySQL returned [{}]. This commonly happens if your current IP is not whitelisted in Aiven IP Filter or credentials were reset. Activating resilient in-memory fallback datasource.", ex.getMessage());
        }

        HikariConfig config = new HikariConfig();
        if (aivenConnected) {
            config.setJdbcUrl(dbUrl);
            config.setUsername(dbUser);
            config.setPassword(dbPassword);
            config.setDriverClassName(driverClassName);
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setPoolName("AivenMySQLPool");
        } else {
            // Resilient MySQL-mode fallback
            config.setJdbcUrl("jdbc:h2:mem:defaultdb;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
            config.setUsername("sa");
            config.setPassword("");
            config.setDriverClassName("org.h2.Driver");
            config.setMaximumPoolSize(5);
            config.setPoolName("ResilientLocalPool");
        }

        return new HikariDataSource(config);
    }
}
