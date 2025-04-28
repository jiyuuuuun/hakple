plugins {
    java
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.avast.gradle.docker-compose") version "0.16.12" // ✅ 다른 플러그인 사용 (Palantir 아님)
}

group = "com.golden_dobakhe"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    compileOnly("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    runtimeOnly("com.mysql:mysql-connector-j")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    runtimeOnly("com.h2database:h2")
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")
    implementation("org.springframework.boot:spring-boot-starter-security") //security
    testImplementation("org.testcontainers:mysql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
    testImplementation("org.springframework.security:spring-security-test")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // JWT & JSON
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

    // Gson - JSON 메시지를 다루기 위한 라이브러리
    implementation("com.google.code.gson:gson")

    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")

    //누리고
    implementation("net.nurigo:sdk:4.2.7") // 누리고 SDK
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // Oauth2
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")

    // AWS S3
    implementation("org.springframework.cloud:spring-cloud-starter-aws:2.2.6.RELEASE")

    // QueryDSL (JPA 동적 쿼리 빌더)
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // Jsoup 추가
    implementation("org.jsoup:jsoup:1.17.2")

}

// Docker Compose 설정 (정상 작동되는 버전)
dockerCompose {
    useComposeFiles.set(listOf("docker-compose.yml"))
    startedServices.set(listOf("mysql"))
    isRequiredBy(tasks.named("bootRun")) // bootRun 실행 시 Docker Compose 자동 실행
    removeContainers.set(true)
    stopContainers.set(true)
    removeVolumes.set(true)
}

// bootRun 작업 종료 시 Docker Compose 정리
tasks.named("bootRun") {
    finalizedBy("dockerComposeDown") // bootRun 작업 종료 후 dockerComposeDown 실행
}
tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}
