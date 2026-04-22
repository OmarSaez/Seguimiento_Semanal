# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiar archivos de configuración de maven primero para aprovechar el cache
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiar código fuente y construir
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el jar generado desde el stage anterior
# Nota: semanal-0.0.1-SNAPSHOT.jar es el nombre por defecto de Maven según pom.xml
COPY --from=build /app/target/semanal-0.0.1-SNAPSHOT.jar app.jar

# Variables de entorno por defecto (pueden ser sobrescritas por Docker Compose)
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/avance_semanal
ENV SPRING_DATASOURCE_USERNAME=postgres
ENV SPRING_DATASOURCE_PASSWORD=postgres

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
