import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    applicationName: '',
    databaseType: 'mongo',
    domain: {
      topic: '',
      groupId: '',
      bootstrapServers: 'localhost:9092'
    },
    interface: {
      topic: '',
      bootstrapServers: 'localhost:9092'
    },
    database: {
      strategy: 'ATOMIC_OUTBOX',
      uri: '',
      database: ''
    },
    spring: {
      serverPort: '8080'
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState({});

  const databaseStrategies = [
    {
      value: 'ATOMIC_OUTBOX',
      label: '🔄 AtomicOutbox',
      description: '🔄 TRANSACTIONAL OUTBOX PATTERN\n\n• Receive messages in batches\n• Bulk insert into database\n• Commit to Kafka within same transaction\n• Transform and send asynchronously\n• Update DB with success status\n\nBest for: High consistency requirements'
    },
    {
      value: 'AUDIT_PERSIST',
      label: '📊 DualPersist',
      description: '📊 DEFENSIVE PERSISTENCE PATTERN\n\n• Receive, transform, and send immediately\n• On SUCCESS: Async save (source + transformed)\n• On FAILURE: Sync save (source + error details)\n• Complete audit trail maintained\n\nBest for: Audit and compliance requirements'
    },
    {
      value: 'FAIL_SAFE',
      label: '🛡️ FailSafe',
      description: '🛡️ FAILURE-ONLY PERSISTENCE PATTERN\n\n• Receive message and transform\n• Send to Kafka immediately\n• Persist ONLY on failures\n• Minimal database overhead\n\nBest for: High performance, low storage'
    }
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleApplicationNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      applicationName: value,
      database: {
        ...prev.database,
        database: value
      }
    }));
  };

  const handleStrategyChange = (strategy) => {
    setFormData(prev => ({
      ...prev,
      database: {
        ...prev.database,
        strategy: strategy
      }
    }));
  };

  const generatePomXml = () => {
    const { applicationName, databaseType } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const className = applicationName.replace(/[^a-zA-Z0-9]/g, '') + 'OrchestratorApplication';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
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
    <artifactId>${artifactId}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>${applicationName}</name>
    <description>Generated orchestrator application using orchestrator-core-adapter and orchestrator-${databaseType}-adapter</description>
    
    <properties>
        <java.version>21</java.version>
        <db.type>${databaseType}</db.type>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.orchestrator</groupId>
            <artifactId>orchestrator-core-adapter</artifactId>
            <version>1.0.0</version>
        </dependency>
        <dependency>
            <groupId>com.orchestrator</groupId>
            <artifactId>orchestrator-\${db.type}-adapter</artifactId>
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
                    <mainClass>com.orchestrator.example.${artifactId.replace(/-/g, '')}.${className}</mainClass>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.12.1</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                    <parameters>true</parameters>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;
  };

  const generateApplicationYml = () => {
    const { applicationName, domain, interface: interfaceConfig, database, spring, databaseType } = formData;
    
    return `orchestrator:
  consumer:
    topic: ${domain.topic}
    group-id: ${domain.groupId}
    bootstrap-servers: ${domain.bootstrapServers}
  producer:
    topic: ${interfaceConfig.topic}
    bootstrap-servers: ${interfaceConfig.bootstrapServers}
  database:
    strategy: ${database.strategy}
spring:
  data:
    ${databaseType === 'mongo' ? 'mongodb' : 'jpa'}:
      ${databaseType === 'mongo' ? `uri: ${database.uri}
      database: ${database.database}` : `url: ${database.uri}
      hibernate:
        ddl-auto: update
      show-sql: true`}
  application:
    name: ${applicationName}
  server:
    port: ${spring.serverPort}`;
  };

  const generateMainApplication = () => {
    const { applicationName } = formData;
    const className = applicationName.replace(/[^a-zA-Z0-9]/g, '') + 'OrchestratorApplication';
    const packageName = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    return `package com.orchestrator.example.${packageName.replace(/-/g, '')};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className} {
    
    public static void main(String[] args) {
        SpringApplication.run(${className}.class, args);
    }
}`;
  };

  const generateMessageTransformer = () => {
    const { applicationName } = formData;
    const className = applicationName.replace(/[^a-zA-Z0-9]/g, '') + 'MessageTransformer';
    const packageName = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    return `package com.orchestrator.example.${packageName.replace(/-/g, '')}.transformer;

import com.orchestrator.core.transformer.MessageTransformer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ${className} implements MessageTransformer {
    
    private static final Logger logger = LoggerFactory.getLogger(${className}.class);
    
    @Override
    public String transform(String input) {
        logger.debug("Transforming ${applicationName} message: {}", input);
        
        // TODO: Implement your custom transformation logic here
        // This is a placeholder implementation - replace with your business logic
        
        String transformed = String.format("""
            {
                "processed": true,
                "original_message": %s,
                "processed_at": %d,
                "processor": "${applicationName.toLowerCase()}",
                "version": "1.0.0",
                "metadata": {
                    "custom_field": "custom_value",
                    "business_logic": "implement_here"
                }
            }
            """, input, System.currentTimeMillis());
        
        logger.debug("${applicationName} transformation completed");
        return transformed;
    }
}`;
  };

  // 1. Manifest YAML (in deploy folder)
  const generateManifestYaml = () => {
    const { applicationName } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${artifactId}-config
  namespace: default
data:
  application.name: "${applicationName}"
  kafka.bootstrap.servers: "${formData.domain.bootstrapServers}"
  database.uri: "${formData.database.uri}"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${artifactId}-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${artifactId}
  template:
    metadata:
      labels:
        app: ${artifactId}
    spec:
      containers:
      - name: ${artifactId}
        image: ${artifactId}:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"`;
  };

  // 2. Config YAML
  const generateConfigYaml = () => {
    const { applicationName, databaseType } = formData;
    
    return `# Configuration for ${applicationName}
application:
  name: "${applicationName}"
  version: "1.0.0"

database:
  type: "${databaseType}"
  uri: "${formData.database.uri}"
  name: "${formData.database.database}"
  strategy: "${formData.database.strategy}"

kafka:
  consumer:
    topic: "${formData.domain.topic}"
    groupId: "${formData.domain.groupId}"
    bootstrapServers: "${formData.domain.bootstrapServers}"
  producer:
    topic: "${formData.interface.topic}"
    bootstrapServers: "${formData.interface.bootstrapServers}"

server:
  port: ${formData.spring.serverPort}`;
  };

  // 3. Dockerfile
  const generateDockerfile = () => {
    const { applicationName } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return `FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy the JAR file
COPY target/${artifactId}-1.0.0.jar app.jar

# Copy configuration files
COPY config.yaml ./config/
COPY deploy/manifest.yaml ./deploy/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]`;
  };

  // 4. Functional Test Groovy
  const generateFunctionalTestGroovy = () => {
    const { applicationName } = formData;
    const className = applicationName.replace(/[^a-zA-Z0-9]/g, '') + 'FunctionalTest';
    
    return `import spock.lang.Specification
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.beans.factory.annotation.Autowired

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ${className} extends Specification {

    @Autowired
    private TestRestTemplate restTemplate

    def "should start application context"() {
        when: "application starts"
        def response = restTemplate.getForEntity("/actuator/health", String.class)
        
        then: "health endpoint should be accessible"
        response.statusCode.value() == 200
        response.body.contains("UP")
    }

    def "should process message correctly"() {
        given: "a test message"
        def testMessage = "test-message-123"
        
        when: "message is processed"
        def response = restTemplate.postForEntity("/api/process", testMessage, String.class)
        
        then: "message should be processed successfully"
        response.statusCode.value() == 200
    }
}`;
  };

  // 5. Jenkinsfile
  const generateJenkinsfile = () => {
    const { applicationName } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return `pipeline {
    agent any
    
    environment {
        APPLICATION_NAME = '${applicationName}'
        ARTIFACT_ID = '${artifactId}'
        DOCKER_IMAGE = '${artifactId}:latest'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package -DskipTests'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    docker.build(DOCKER_IMAGE)
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f deploy/manifest.yaml'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}`;
  };

  // 6. Settings XML
  const generateSettingsXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">

    <localRepository>\${user.home}/.m2/repository</localRepository>
    
    <mirrors>
        <mirror>
            <id>central-mirror</id>
            <name>Central Repository Mirror</name>
            <url>https://repo1.maven.org/maven2</url>
            <mirrorOf>central</mirrorOf>
        </mirror>
    </mirrors>
    
    <profiles>
        <profile>
            <id>default</id>
            <repositories>
                <repository>
                    <id>central</id>
                    <name>Central Repository</name>
                    <url>https://repo1.maven.org/maven2</url>
                </repository>
            </repositories>
        </profile>
    </profiles>
    
    <activeProfiles>
        <activeProfile>default</activeProfile>
    </activeProfiles>
</settings>`;
  };

  // 7. Sonar Project Properties
  const generateSonarProjectProperties = () => {
    const { applicationName } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return `# SonarQube configuration for ${applicationName}
sonar.projectKey=${artifactId}
sonar.projectName=${applicationName}
sonar.projectVersion=1.0.0

# Source code location
sonar.sources=src/main/java
sonar.tests=src/test/java

# Java version
sonar.java.source=21

# Coverage reports
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml

# Exclude patterns
sonar.exclusions=**/generated/**,**/target/**,**/test/**

# Quality Gate
sonar.qualitygate.wait=true`;
  };

  // 8. SDLC2Map Groovy (in vars folder)
  const generateSdlc2MapGroovy = () => {
    const { applicationName } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    return `#!/usr/bin/env groovy

def call(String stage = 'build') {
    def stages = [
        'build': [
            'name': 'Build',
            'steps': ['mvn clean compile', 'mvn package -DskipTests']
        ],
        'test': [
            'name': 'Test',
            'steps': ['mvn test', 'mvn jacoco:report']
        ],
        'quality': [
            'name': 'Quality Check',
            'steps': ['mvn sonar:sonar']
        ],
        'deploy': [
            'name': 'Deploy',
            'steps': ['docker build -t ${artifactId}:latest .', 'kubectl apply -f deploy/manifest.yaml']
        ]
    ]
    
    def currentStage = stages[stage]
    if (!currentStage) {
        error "Unknown stage: \${stage}"
    }
    
    echo "Executing \${currentStage.name} stage for ${applicationName}"
    
    currentStage.steps.each { step ->
        sh step
    }
    
    echo "\${currentStage.name} stage completed successfully"
}`;
  };

  const generatePreview = () => {
    const { applicationName, databaseType } = formData;
    const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const packageName = artifactId.replace(/-/g, '');

    const readmeContent = `# ${applicationName}

This is a generated orchestrator application using the orchestrator-core-adapter and orchestrator-${databaseType}-adapter.

## Features

- Kafka consumer and producer configuration
- ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'} database integration
- Custom message transformation logic
- Spring Boot 3.3.5 with Java 21
- Database Strategy: ${formData.database.strategy}

## Configuration

The application is configured via \`application.yml\` with the following settings:

- **Domain Topic**: ${formData.domain.topic}
- **Interface Topic**: ${formData.interface.topic}
- **Database**: ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'}
- **Database Strategy**: ${formData.database.strategy}

## Running the Application

1. Ensure you have Java 21 installed
2. Make sure Kafka is running on ${formData.domain.bootstrapServers}
3. Ensure ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'} is running
4. Run: \`mvn spring-boot:run\`

## Customization

Edit the \`${applicationName.replace(/[^a-zA-Z0-9]/g, '')}MessageTransformer.java\` file to implement your custom business logic for message transformation.

## Dependencies

- orchestrator-core-adapter (1.0.0)
- orchestrator-${databaseType}-adapter (1.0.0)
- Spring Boot 3.3.5
`;

    const files = {
      'pom.xml': generatePomXml(),
      'src/main/resources/application.yml': generateApplicationYml(),
      [`src/main/java/com/orchestrator/example/${packageName}/${applicationName.replace(/[^a-zA-Z0-9]/g, '')}OrchestratorApplication.java`]: generateMainApplication(),
      [`src/main/java/com/orchestrator/example/${packageName}/transformer/${applicationName.replace(/[^a-zA-Z0-9]/g, '')}MessageTransformer.java`]: generateMessageTransformer(),
      'README.md': readmeContent,
      
      // NEW FILES - Add your new files here
      'deploy/manifest.yaml': generateManifestYaml(),
      'config.yaml': generateConfigYaml(),
      'Dockerfile': generateDockerfile(),
      'functionalTest.groovy': generateFunctionalTestGroovy(),
      'Jenkinsfile': generateJenkinsfile(),
      'settings.xml': generateSettingsXml(),
      'sonar-project.properties': generateSonarProjectProperties(),
      'vars/sdlc2Map.groovy': generateSdlc2MapGroovy()
    };

    setPreviewFiles(files);
    setShowPreview(true);
  };

  const generateProject = async () => {
    setIsGenerating(true);
    setMessage('');

    try {
      const zip = new JSZip();
      const { applicationName, databaseType } = formData;
      const artifactId = applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const packageName = artifactId.replace(/-/g, '');

      // Create project structure
      const srcMainJava = zip.folder(`src/main/java/com/orchestrator/example/${packageName}`);
      const srcMainResources = zip.folder('src/main/resources');
      const transformerFolder = srcMainJava.folder('transformer');

      // Add pom.xml
      zip.file('pom.xml', generatePomXml());

      // Add application.yml
      srcMainResources.file('application.yml', generateApplicationYml());

      // Add main application class
      srcMainJava.file(`${applicationName.replace(/[^a-zA-Z0-9]/g, '')}OrchestratorApplication.java`, generateMainApplication());

      // Add message transformer
      transformerFolder.file(`${applicationName.replace(/[^a-zA-Z0-9]/g, '')}MessageTransformer.java`, generateMessageTransformer());

      // NEW FILES - Add your new files here
      // Create folders first
      const deployFolder = zip.folder('deploy');
      const varsFolder = zip.folder('vars');
      const configMapFolder = zip.folder('configMap'); // Empty folder

      // Add files to folders
      deployFolder.file('manifest.yaml', generateManifestYaml());
      varsFolder.file('sdlc2Map.groovy', generateSdlc2MapGroovy());

      // Add files to root
      zip.file('config.yaml', generateConfigYaml());
      zip.file('Dockerfile', generateDockerfile());
      zip.file('functionalTest.groovy', generateFunctionalTestGroovy());
      zip.file('Jenkinsfile', generateJenkinsfile());
      zip.file('settings.xml', generateSettingsXml());
      zip.file('sonar-project.properties', generateSonarProjectProperties());

      // Add README.md
      const readme = `# ${applicationName}

This is a generated orchestrator application using the orchestrator-core-adapter and orchestrator-${databaseType}-adapter.

## Features

- Kafka consumer and producer configuration
- ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'} database integration
- Custom message transformation logic
- Spring Boot 3.3.5 with Java 21
- Database Strategy: ${formData.database.strategy}

## Configuration

The application is configured via \`application.yml\` with the following settings:

- **Domain Topic**: ${formData.domain.topic}
- **Interface Topic**: ${formData.interface.topic}
- **Database**: ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'}
- **Database Strategy**: ${formData.database.strategy}

## Running the Application

1. Ensure you have Java 21 installed
2. Make sure Kafka is running on ${formData.domain.bootstrapServers}
3. Ensure ${databaseType === 'mongo' ? 'MongoDB' : 'PostgreSQL'} is running
4. Run: \`mvn spring-boot:run\`

## Customization

Edit the \`${applicationName.replace(/[^a-zA-Z0-9]/g, '')}MessageTransformer.java\` file to implement your custom business logic for message transformation.

## Dependencies

- orchestrator-core-adapter (1.0.0)
- orchestrator-${databaseType}-adapter (1.0.0)
- Spring Boot 3.3.5
`;

      zip.file('README.md', readme);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${artifactId}.zip`);

      setMessage('Project generated successfully! Check your downloads folder.');
    } catch (error) {
      setMessage('Error generating project: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = () => {
    return formData.applicationName.trim() !== '' &&
           formData.domain.topic.trim() !== '' &&
           formData.domain.groupId.trim() !== '' &&
           formData.interface.topic.trim() !== '' &&
           formData.database.uri.trim() !== '' &&
           formData.database.database.trim() !== '';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 Event Adapter Project Initializer</h1>
        <p>✨ Create Spring Boot orchestrator applications with Kafka integration and database adapters</p>
      </div>

      {message && (
        <div className={`${message.includes('Error') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <div className="preview-header">
              <h3>Generated Files Preview</h3>
              <button onClick={() => setShowPreview(false)} className="close-btn">×</button>
            </div>
            <div className="preview-files">
              {Object.entries(previewFiles).map(([filename, content]) => (
                <div key={filename} className="preview-file">
                  <h4>{filename}</h4>
                  <pre><code>{content}</code></pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        <div className="left-panel">
          <div className="section">
            <h3>⚙️ Project Configuration</h3>
            <div className="form-group">
              <label htmlFor="applicationName">Application Name *</label>
              <input
                type="text"
                id="applicationName"
                value={formData.applicationName}
                onChange={(e) => handleApplicationNameChange(e.target.value)}
                placeholder="e.g., example-payment-orchestrator"
              />
            </div>

            <div className="form-group">
              <label htmlFor="databaseType">Database Type *</label>
              <select
                id="databaseType"
                value={formData.databaseType}
                onChange={(e) => setFormData(prev => ({ ...prev, databaseType: e.target.value }))}
              >
                <option value="mongo">MongoDB</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>
          </div>

          <div className="section">
            <h3>🌐 Domain Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="domainTopic">Topic *</label>
                <input
                  type="text"
                  id="domainTopic"
                  value={formData.domain.topic}
                  onChange={(e) => handleInputChange('domain', 'topic', e.target.value)}
                  placeholder="e.g., payment-input-topic"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="domainGroupId">Group ID *</label>
                <input
                  type="text"
                  id="domainGroupId"
                  value={formData.domain.groupId}
                  onChange={(e) => handleInputChange('domain', 'groupId', e.target.value)}
                  placeholder="e.g., payment-orchestrator-group"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="domainBootstrapServers">Bootstrap Servers</label>
              <input
                type="text"
                id="domainBootstrapServers"
                value={formData.domain.bootstrapServers}
                onChange={(e) => handleInputChange('domain', 'bootstrapServers', e.target.value)}
                placeholder="localhost:9092"
              />
            </div>
          </div>

          <div className="section">
            <h3>🔌 Interface Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="interfaceTopic">Topic *</label>
                <input
                  type="text"
                  id="interfaceTopic"
                  value={formData.interface.topic}
                  onChange={(e) => handleInputChange('interface', 'topic', e.target.value)}
                  placeholder="e.g., payment-output-topic"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="interfaceBootstrapServers">Bootstrap Servers</label>
                <input
                  type="text"
                  id="interfaceBootstrapServers"
                  value={formData.interface.bootstrapServers}
                  onChange={(e) => handleInputChange('interface', 'bootstrapServers', e.target.value)}
                  placeholder="localhost:9092"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="section">
            <h3>🗄️ Database Configuration</h3>
            <div className="form-group">
              <label htmlFor="databaseUri">Database URI *</label>
              <input
                type="text"
                id="databaseUri"
                value={formData.database.uri}
                onChange={(e) => handleInputChange('database', 'uri', e.target.value)}
                placeholder={formData.databaseType === 'mongo' ? 'mongodb://localhost:27017/payment-orchestrator' : 'jdbc:postgresql://localhost:5432/payment_orchestrator'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="databaseName">Database Name *</label>
              <input
                type="text"
                id="databaseName"
                value={formData.database.database}
                onChange={(e) => handleInputChange('database', 'database', e.target.value)}
                placeholder={formData.databaseType === 'mongo' ? 'payment-orchestrator' : 'payment_orchestrator'}
              />
            </div>

            <div className="form-group">
              <label>Database Strategy *</label>
              {databaseStrategies.map((strategy) => (
                <div 
                  key={strategy.value}
                  className={`strategy-option ${formData.database.strategy === strategy.value ? 'selected' : ''}`}
                  onClick={() => handleStrategyChange(strategy.value)}
                >
                  <input
                    type="radio"
                    id={strategy.value}
                    name="strategy"
                    value={strategy.value}
                    checked={formData.database.strategy === strategy.value}
                    onChange={() => handleStrategyChange(strategy.value)}
                  />
                  <label htmlFor={strategy.value}>{strategy.label}</label>
                  <div className="strategy-description">{strategy.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>🖥️ Server Configuration</h3>
            <div className="form-group">
              <label htmlFor="serverPort">Server Port</label>
              <input
                type="text"
                id="serverPort"
                value={formData.spring.serverPort}
                onChange={(e) => handleInputChange('spring', 'serverPort', e.target.value)}
                placeholder="8080"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="generate-section">
        <h3>🎯 Generate Project</h3>
        <p>✨ Preview the generated files or download your orchestrator project as a ZIP file.</p>
        
        <div className="button-group">
          <button
            className="btn btn-secondary"
            onClick={generatePreview}
            disabled={!isFormValid()}
          >
            👁️ Preview Files
          </button>
          
          <button
            className="btn"
            onClick={generateProject}
            disabled={!isFormValid() || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading"></span>
                Generating Project...
              </>
            ) : (
              '🚀 Generate & Download Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
