# Multi-stage Docker build for Spring Boot Backend
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/portal-backend-1.0.0.jar app.jar
EXPOSE 8080
ENV SERVER_PORT=8080
ENTRYPOINT ["sh", "-c", "java -XX:+UseSerialGC -Xms128m -Xmx280m -Xss512k -XX:MetaspaceSize=96m -XX:MaxMetaspaceSize=160m -XX:+ExitOnOutOfMemoryError -Dserver.port=${PORT:-8080} -jar app.jar"]
