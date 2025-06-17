# MongoDB Integration for Contacts

This project uses MongoDB to store contact information. This document provides instructions on how to set up and use the MongoDB integration.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Node.js and npm

## Setup

1. Start the MongoDB containers:

```bash
npm run docker:up
```

This will start:
- MongoDB on port 27017
- Mongo Express (web UI) on port 8081

2. Create a `.env.local` file in the root of the project with the following content:

```
MONGODB_URI=mongodb://admin:password@localhost:27017/contacts?authSource=admin
```

3. Seed the database with mock data (optional):

```bash
npm run db:seed
```

## Accessing MongoDB

### MongoDB Connection Details

- **Host**: localhost
- **Port**: 27017
- **Username**: admin
- **Password**: password
- **Database**: contacts
- **Auth Source**: admin

### Mongo Express (Web UI)

You can access the MongoDB web interface at:

```
http://localhost:8081
```

- **Username**: admin
- **Password**: password

## API Endpoints

The following API endpoints are available for contact management:

### Get all contacts for a user
```
GET /api/contacts?ownerId={ownerId}
```

### Create a new contact
```
POST /api/contacts
```
Body:
```json
{
  "ownerId": "user1",
  "name": "John Doe",
  "email": "john@example.com",
  "tags": ["Friend", "Work"]
}
```

### Get a contact by ID
```
GET /api/contacts/{id}
```

### Update a contact
```
PATCH /api/contacts/{id}
```
Body: (fields to update)
```json
{
  "email": "newemail@example.com",
  "phone": "123-456-7890"
}
```

### Delete a contact
```
DELETE /api/contacts/{id}
```

### Search contacts
```
GET /api/contacts/search?ownerId={ownerId}&q={searchQuery}
```

### Filter contacts by tag
```
GET /api/contacts/search?ownerId={ownerId}&tag={tagName}
```

### Filter contacts by category
```
GET /api/contacts/search?ownerId={ownerId}&category={categoryName}
```

## Stopping the Database

To stop the MongoDB containers:

```bash
npm run docker:down
```

## Data Model

The Contact model includes the following fields:

- `id`: MongoDB document ID
- `ownerId`: User ID that owns this contact
- `name`: Contact's name
- `photoURL`: URL to profile photo
- `birthday`: Birthday in YYYY-MM-DD format
- `hometown`: Hometown location
- `currentLocation`: Current location
- `occupation`: Job title
- `company`: Company name
- `college`: College/University name
- `socialProfiles`: Object containing social media profiles
- `phone`: Phone number
- `email`: Email address
- `category`: Contact category (e.g., "Family", "Friend", "Colleague")
- `ownerRelationshipLabel`: User's relationship to this contact
- `importSource`: How the contact was imported
- `tags`: Array of tags
- `notes`: Additional notes
- `photosTogether`: Array of photo URLs
- `relationships`: Array of relationships to other contacts
- `notableEvents`: Array of notable events
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp 