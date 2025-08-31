# Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

### Option 1: Using the provided scripts

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm start
```

3. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Using the UI

1. **Fill in the form:**
   - Application Name: `example-payment-orchestrator`
   - Database Type: `MongoDB`
   - Consumer Topic: `payment-input-topic`
   - Consumer Group ID: `payment-orchestrator-group`
   - Producer Topic: `payment-output-topic`
   - Database URI: `mongodb://localhost:27017/payment-orchestrator`
   - Database Name: `payment-orchestrator`

2. **Generate the project:**
   - Click "Generate & Download Project"
   - The project will be downloaded as a ZIP file

3. **Extract and run:**
   - Extract the ZIP file
   - Navigate to the project directory
   - Run: `mvn spring-boot:run`

## Example Configuration

Here's a complete example configuration:

### Project Configuration
- **Application Name**: `example-payment-orchestrator`
- **Database Type**: `MongoDB`

### Kafka Configuration
- **Consumer Topic**: `payment-input-topic`
- **Consumer Group ID**: `payment-orchestrator-group`
- **Consumer Bootstrap Servers**: `localhost:9092`
- **Producer Topic**: `payment-output-topic`
- **Producer Bootstrap Servers**: `localhost:9092`

### Database Configuration
- **Database URI**: `mongodb://localhost:27017/payment-orchestrator`
- **Database Name**: `payment-orchestrator`
- **Database Strategy**: `ATOMIC_OUTBOX`

### Spring Configuration
- **Spring Application Name**: `payment-orchestrator`
- **Server Port**: `8080`

## Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   - The app will automatically try port 3001, 3002, etc.
   - Or kill the process using port 3000

2. **npm install fails:**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json
   - Run `npm install` again

3. **Generated project doesn't compile:**
   - Ensure Java 21 is installed
   - Check that all required fields are filled in the form
   - Verify Kafka and database are running

### Getting Help

- Check the main README.md for detailed documentation
- Look at the sample-generated-project folder for examples
- Ensure all prerequisites are installed correctly


