# MongoDB Atlas Integration

This document provides instructions on how to use the MongoDB Atlas integration for the Contacts application.

## Connection Details

The application is configured to connect to MongoDB Atlas using the following connection string:

```
mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts
```

## Setup

1. The connection string is already configured in the application. It's set in:
   - `src/lib/mongodb/config.ts` for the Next.js application
   - Docker Compose files for containerized environments

2. A `.env.local` file has been created with the MongoDB Atlas connection string.

## Available Scripts

### Test MongoDB Atlas Connection

To test the connection to MongoDB Atlas:

```bash
npm run db:test
```

This will connect to MongoDB Atlas, list the available databases and collections, and show sample contacts if available.

### Seed MongoDB Atlas with Sample Data

To seed MongoDB Atlas with sample contacts:

```bash
npm run db:seed:atlas
```

This will insert sample contacts into the MongoDB Atlas database.

## Docker Integration

The Docker containers are configured to use MongoDB Atlas instead of a local MongoDB instance:

1. For production:

```bash
npm run docker:build
npm run docker:up
```

2. For development:

```bash
npm run docker:dev:build
npm run docker:dev
```

## Accessing MongoDB Atlas

You can access the MongoDB Atlas dashboard at [https://cloud.mongodb.com](https://cloud.mongodb.com) using the provided credentials.

## Data Model

The Contact model includes the following fields:

- `id`: Document ID
- `ownerId`: User ID that owns this contact
- `name`: Contact's name
- `photoURL`: URL to profile photo
- `category`: Contact category (e.g., "Family", "Friend", "Colleague")
- `tags`: Array of tags
- `email`: Email address
- `phone`: Phone number
- `occupation`: Job title
- `company`: Company name
- `college`: College/University name
- `hometown`: Hometown location
- `currentLocation`: Current location
- `relationships`: Array of relationships to other contacts
- `photosTogether`: Array of photo URLs
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp 