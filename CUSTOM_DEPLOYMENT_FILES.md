# Adding Custom Deployment Files

This document explains how to add custom deployment files to your generated orchestrator projects.

## Overview

The Orchestrator Project Generator supports adding custom deployment files that will be included in the generated project ZIP. This allows you to include:

- Docker configurations
- Kubernetes manifests
- CI/CD pipelines
- Environment-specific configurations
- Custom scripts
- Documentation files

## How to Add Custom Files

### 1. **Web UI Method** (Recommended)

The web UI will be enhanced to include a "Custom Files" section where you can:

1. **Upload Files**: Drag and drop or select files to include
2. **Specify Path**: Define where each file should be placed in the generated project
3. **Preview**: See the file structure before generation
4. **Template Variables**: Use template variables in your custom files

### 2. **Configuration File Method**

Create a `custom-files.json` configuration file:

```json
{
  "customFiles": [
    {
      "name": "Dockerfile",
      "content": "FROM openjdk:21-jdk-slim\n\nWORKDIR /app\nCOPY target/*.jar app.jar\nEXPOSE 8080\nCMD [\"java\", \"-jar\", \"app.jar\"]",
      "path": "Dockerfile"
    },
    {
      "name": "docker-compose.yml",
      "content": "version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - \"8080:8080\"\n    environment:\n      - SPRING_PROFILES_ACTIVE=docker",
      "path": "docker-compose.yml"
    },
    {
      "name": "k8s-deployment.yaml",
      "content": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: {{APPLICATION_NAME}}\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: {{APPLICATION_NAME}}",
      "path": "k8s/deployment.yaml"
    }
  ]
}
```

## Supported File Types

### 1. **Docker Files**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### 2. **Kubernetes Manifests**
- `deployment.yaml`
- `service.yaml`
- `configmap.yaml`
- `secret.yaml`
- `ingress.yaml`

### 3. **CI/CD Pipelines**
- `.github/workflows/ci.yml`
- `.gitlab-ci.yml`
- `Jenkinsfile`
- `azure-pipelines.yml`

### 4. **Environment Configurations**
- `application-dev.yml`
- `application-prod.yml`
- `application-docker.yml`
- `.env.example`

### 5. **Scripts**
- `start.sh`
- `stop.sh`
- `health-check.sh`
- `migrate.sh`

### 6. **Documentation**
- `DEPLOYMENT.md`
- `API.md`
- `TROUBLESHOOTING.md`

## Template Variables

You can use template variables in your custom files that will be replaced with actual values:

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{APPLICATION_NAME}}` | The application name | `payment-orchestrator` |
| `{{DATABASE_TYPE}}` | Database type (mongo/postgres) | `mongo` |
| `{{DOMAIN_TOPIC}}` | Domain Kafka topic | `payment-input-topic` |
| `{{INTERFACE_TOPIC}}` | Interface Kafka topic | `payment-output-topic` |
| `{{DATABASE_URI}}` | Database connection URI | `mongodb://localhost:27017` |
| `{{DATABASE_NAME}}` | Database name | `payment-orchestrator` |
| `{{STRATEGY}}` | Database strategy | `ATOMIC_OUTBOX` |
| `{{SERVER_PORT}}` | Server port | `8080` |
| `{{PACKAGE_NAME}}` | Java package name | `com.orchestrator.example.paymentorchestrator` |
| `{{CLASS_NAME}}` | Main application class name | `PaymentOrchestratorApplication` |

### Example Usage

**Dockerfile with Variables:**
```dockerfile
FROM openjdk:21-jdk-slim

WORKDIR /app
COPY target/{{APPLICATION_NAME}}-1.0.0.jar app.jar

ENV SPRING_PROFILES_ACTIVE=docker
ENV SERVER_PORT={{SERVER_PORT}}

EXPOSE {{SERVER_PORT}}
CMD ["java", "-jar", "app.jar"]
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{APPLICATION_NAME}}
  labels:
    app: {{APPLICATION_NAME}}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: {{APPLICATION_NAME}}
  template:
    metadata:
      labels:
        app: {{APPLICATION_NAME}}
    spec:
      containers:
      - name: {{APPLICATION_NAME}}
        image: {{APPLICATION_NAME}}:latest
        ports:
        - containerPort: {{SERVER_PORT}}
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: DATABASE_URI
          value: "{{DATABASE_URI}}"
```

## File Structure Examples

### 1. **Docker Deployment**
```
project-root/
├── src/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── README.md
```

### 2. **Kubernetes Deployment**
```
project-root/
├── src/
├── pom.xml
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── ingress.yaml
└── README.md
```

### 3. **Complete CI/CD Setup**
```
project-root/
├── src/
├── pom.xml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
├── scripts/
│   ├── start.sh
│   └── health-check.sh
├── docs/
│   ├── DEPLOYMENT.md
│   └── API.md
└── README.md
```

## Best Practices

### 1. **File Organization**
- Group related files in directories (e.g., `k8s/`, `scripts/`, `docs/`)
- Use descriptive file names
- Follow naming conventions for your target platform

### 2. **Template Variables**
- Use template variables for dynamic content
- Provide sensible defaults
- Document all available variables

### 3. **Environment-Specific Configs**
- Create separate configs for different environments
- Use Spring profiles for environment-specific settings
- Include environment validation

### 4. **Security**
- Never include sensitive data in templates
- Use environment variables for secrets
- Follow security best practices for each platform

### 5. **Documentation**
- Include deployment instructions
- Document configuration options
- Provide troubleshooting guides

## Implementation Status

### ✅ **Completed**
- Basic file generation framework
- Template variable support
- ZIP file creation

### 🚧 **In Progress**
- Web UI custom files section
- File upload functionality
- Preview for custom files

### 📋 **Planned**
- Template library
- File validation
- Advanced template features

## Contributing

To add support for new file types or deployment platforms:

1. Create a new template file
2. Add template variables as needed
3. Update the documentation
4. Test with different configurations
5. Submit a pull request

## Support

For questions about adding custom deployment files:

1. Check the documentation
2. Review existing examples
3. Open an issue on GitHub
4. Contact the development team


