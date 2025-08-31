# Example Generated Project Structure

This folder shows what a generated orchestrator project would look like.

## Generated Files

### pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.5</version>
        <relativePath/>
    </parent>
    
    <groupId>com.orchestrator.example</groupId>
    <artifactId>example-payment-orchestrator</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Example Payment Orchestrator</name>
    <description>Generated orchestrator application using orchestrator-core-adapter and orchestrator-mongo-adapter</description>
    
    <properties>
        <java.version>21</java.version>
        <db.type>mongo</db.type>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.orchestrator</groupId>
            <artifactId>orchestrator-core-adapter</artifactId>
            <version>1.0.0</version>
        </dependency>
        <dependency>
            <groupId>com.orchestrator</groupId>
            <artifactId>orchestrator-${db.type}-adapter</artifactId>
            <version>1.0.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>3.3.5</version>
                <configuration>
                    <mainClass>com.orchestrator.example.examplepaymentorchestrator.ExamplePaymentOrchestratorOrchestratorApplication</mainClass>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.12.1</version>
                <configuration>
                    <source>${java.version}</source>
                    <target>${java.version}</target>
                    <parameters>true</parameters>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### src/main/resources/application.yml
```yaml
orchestrator:
  consumer:
    topic: payment-input-topic
    group-id: payment-orchestrator-group
    bootstrap-servers: localhost:9092
  producer:
    topic: payment-output-topic
    bootstrap-servers: localhost:9092
  database:
    strategy: ATOMIC_OUTBOX
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/payment-orchestrator
      database: payment-orchestrator
  application:
    name: payment-orchestrator
  server:
    port: 8080
```

### src/main/java/com/orchestrator/example/examplepaymentorchestrator/ExamplePaymentOrchestratorOrchestratorApplication.java
```java
package com.orchestrator.example.examplepaymentorchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ExamplePaymentOrchestratorOrchestratorApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ExamplePaymentOrchestratorOrchestratorApplication.class, args);
    }
}
```

### src/main/java/com/orchestrator/example/examplepaymentorchestrator/transformer/ExamplePaymentOrchestratorMessageTransformer.java
```java
package com.orchestrator.example.examplepaymentorchestrator.transformer;

import com.orchestrator.core.transformer.MessageTransformer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ExamplePaymentOrchestratorMessageTransformer implements MessageTransformer {
    
    private static final Logger logger = LoggerFactory.getLogger(ExamplePaymentOrchestratorMessageTransformer.class);
    
    @Override
    public String transform(String input) {
        logger.debug("Transforming Example Payment Orchestrator message: {}", input);
        
        // TODO: Implement your custom transformation logic here
        // This is a placeholder implementation - replace with your business logic
        
        String transformed = String.format("""
            {
                "processed": true,
                "original_message": %s,
                "processed_at": %d,
                "processor": "example-payment-orchestrator",
                "version": "1.0.0",
                "metadata": {
                    "custom_field": "custom_value",
                    "business_logic": "implement_here"
                }
            }
            """, input, System.currentTimeMillis());
        
        logger.debug("Example Payment Orchestrator transformation completed");
        return transformed;
    }
}
```

## Project Structure
```
example-payment-orchestrator/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/
        │   └── com/orchestrator/example/
        │       └── examplepaymentorchestrator/
        │           ├── ExamplePaymentOrchestratorOrchestratorApplication.java
        │           └── transformer/
        │               └── ExamplePaymentOrchestratorMessageTransformer.java
        └── resources/
            └── application.yml
```

## Features

- **Kafka Integration**: Consumer and producer configuration
- **Database Support**: MongoDB adapter with ATOMIC_OUTBOX strategy
- **Custom Transformer**: Placeholder for business logic implementation
- **Spring Boot 3.3.5**: Modern Spring Boot application
- **Java 21**: Latest LTS Java version
- **Maven Build**: Standard Maven project structure

## Next Steps

1. Extract the generated ZIP file
2. Navigate to the project directory
3. Ensure Kafka and MongoDB are running
4. Run: `mvn spring-boot:run`
5. Customize the MessageTransformer for your business logic


