# Docker Setup for Contacts Application

This document provides instructions on how to use Docker to run the Contacts application with MongoDB integration.

## Prerequisites

- Docker and Docker Compose installed on your machine

## Available Docker Configurations

### Production Setup

The production setup includes:
- Next.js application container
- MongoDB database container
- MongoDB Express web interface (port 8081)
- MongoDB Compass alternative (port 8082)

### Development Setup

The development setup includes:
- Next.js development server with hot-reloading
- MongoDB database container
- MongoDB Express web interface

## Running the Application

### Production Mode

1. Build and start all containers:

```bash
npm run docker:build
npm run docker:up
```

2. Access the application and tools:
   - Next.js application: http://localhost:3000
   - MongoDB Express: http://localhost:8081
   - MongoDB Compass alternative: http://localhost:8082

3. To stop all containers:

```bash
npm run docker:down
```

4. To view logs:

```bash
npm run docker:logs
```

### Development Mode

1. Start the development environment:

```bash
npm run docker:dev
```

2. Access the application and tools:
   - Next.js development server: http://localhost:9002
   - MongoDB Express: http://localhost:8081

3. To stop all development containers:

```bash
npm run docker:dev:down
```

4. To view development logs:

```bash
npm run docker:dev:logs
```

## Database Seeding

To seed the database with mock data:

### Production Environment

```bash
# Start the containers if not already running
npm run docker:up

# Run the seeding service
npm run docker:seed
```

### Development Environment

```bash
# Start the development containers if not already running
npm run docker:dev

# Run the seeding service for development
npm run docker:dev:seed
```

The seeding process is handled by a dedicated container that automatically connects to MongoDB and populates it with sample data.

## MongoDB Connection Details

### From Inside Containers

When connecting to MongoDB from inside a Docker container (like the Next.js app), use:

```
mongodb://admin:password@mongodb:27017/contacts?authSource=admin
```

### From Host Machine

When connecting to MongoDB from your local machine (outside Docker), use:

```
mongodb://admin:password@localhost:27017/contacts?authSource=admin
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to MongoDB:

1. Ensure the MongoDB container is running:
   ```bash
   docker ps | grep mongodb
   ```

2. Check MongoDB logs:
   ```bash
   docker logs contacts-mongodb
   ```

3. Try connecting directly to the MongoDB container:
   ```bash
   docker exec -it contacts-mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```

### Volume Persistence

MongoDB data is stored in a Docker volume. To completely reset the database:

```bash
npm run docker:down
docker volume rm studio_mongodb_data
npm run docker:up
``` 