#!/bin/bash

# Copy the seed file to the container
echo "Copying seed file to MongoDB container..."
docker cp seed-mongo.js contacts-mongodb:/seed-mongo.js

# Execute the seed script
echo "Running seed script in MongoDB container..."
docker exec contacts-mongodb mongosh --quiet -u admin -p password --authenticationDatabase admin /seed-mongo.js

echo "Seeding completed." 