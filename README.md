# Orchestrator Project Generator UI

A modern web application for generating Spring Boot orchestrator projects with Kafka integration and database adapters.

## Features

- **Interactive Form**: User-friendly interface for configuring orchestrator projects
- **Database Support**: Choose between MongoDB and PostgreSQL adapters
- **Kafka Configuration**: Configure consumer and producer topics and settings
- **Auto-generation**: Automatically generates complete Maven project structure
- **Download**: Download generated projects as ZIP files
- **Modern UI**: Beautiful, responsive design with gradient backgrounds

## Generated Project Structure

The UI generates complete Spring Boot orchestrator projects with:

```
project-name/
├── pom.xml                          # Maven configuration with dependencies
├── README.md                        # Project documentation
└── src/
    └── main/
        ├── java/
        │   └── com/orchestrator/example/
        │       └── projectname/
        │           ├── ProjectNameOrchestratorApplication.java
        │           └── transformer/
        │               └── ProjectNameMessageTransformer.java
        └── resources/
            └── application.yml      # Spring Boot configuration
```

## Dependencies

The generated projects include:

- **orchestrator-core-adapter** (1.0.0) - Core Kafka consumer/producer functionality
- **orchestrator-mongo-adapter** (1.0.0) - MongoDB integration
- **orchestrator-postgres-adapter** (1.0.0) - PostgreSQL integration
- **Spring Boot** (3.3.5) - Application framework
- **Java 21** - Runtime environment

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd orchestrator-generator-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Usage

1. **Project Configuration**
   - Enter your application name (e.g., "example-payment-orchestrator")
   - Select database type (MongoDB or PostgreSQL)

2. **Kafka Configuration**
   - Configure consumer topic and group ID
   - Set producer topic
   - Configure bootstrap servers (default: localhost:9092)

3. **Database Configuration**
   - Enter database URI
   - Set database name
   - Choose database strategy (ATOMIC_OUTBOX, SAGA, CHOREOGRAPHY)

4. **Spring Configuration**
   - Set application name
   - Configure server port (default: 8080)

5. **Generate Project**
   - Click "Generate & Download Project"
   - The project will be downloaded as a ZIP file

## Configuration Examples

### MongoDB Configuration
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/payment-orchestrator
      database: payment-orchestrator
```

### PostgreSQL Configuration
```yaml
spring:
  data:
    jpa:
      url: jdbc:postgresql://localhost:5432/payment_orchestrator
      hibernate:
        ddl-auto: update
      show-sql: true
```

### Kafka Configuration
```yaml
orchestrator:
  consumer:
    topic: payment-input-topic
    group-id: payment-orchestrator-group
    bootstrap-servers: localhost:9092
  producer:
    topic: payment-output-topic
    bootstrap-servers: localhost:9092
```

## Customization

After generating a project, you can customize:

1. **Message Transformer**: Edit the generated `MessageTransformer.java` file to implement your business logic
2. **Configuration**: Modify `application.yml` for your specific environment
3. **Dependencies**: Add additional dependencies to `pom.xml` as needed

## Running Generated Projects

1. Extract the downloaded ZIP file
2. Navigate to the project directory
3. Ensure you have Java 21 installed
4. Make sure Kafka and your chosen database are running
5. Run: `mvn spring-boot:run`

## Technology Stack

- **Frontend**: React 18, CSS3 with modern gradients
- **File Generation**: JSZip for creating ZIP files
- **File Download**: FileSaver.js for browser downloads
- **Styling**: Custom CSS with responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.


