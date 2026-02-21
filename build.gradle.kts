plugins {
    java
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.poc"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Spring Data JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Spring Data Redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // Spring Cache
    implementation("org.springframework.boot:spring-boot-starter-cache")

    // PostgreSQL Driver
    runtimeOnly("org.postgresql:postgresql")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
}
