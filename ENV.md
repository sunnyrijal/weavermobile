# Environment Variables

This document describes the environment variables used in the application.

## MongoDB Connection

The application uses MongoDB for storing contacts data. You need to set up the MongoDB connection string in your environment.

### Setup Instructions

1. Create a `.env.local` file in the root of the project
2. Add the following environment variable:

```
# MongoDB Connection
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster-url/contacts?retryWrites=true&w=majority
```

### MongoDB Atlas Setup (Recommended)

If you're using MongoDB Atlas:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create an account or log in
3. Create a new cluster
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `your-username`, `your-password`, and `your-cluster-url` with your actual credentials

### Self-hosted MongoDB

If you're using a self-hosted MongoDB instance:

```
MONGODB_URI=mongodb://username:password@hostname:port/contacts?authSource=admin
```

## Other Environment Variables

```
# Environment
NODE_ENV=development
``` 