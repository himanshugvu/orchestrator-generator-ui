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
      'README.md': readmeContent
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
