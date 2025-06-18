# Contacts API Integration

This document explains how the contacts functionality has been integrated with MongoDB Atlas.

## Changes Made

1. **Created a React Hook for Contacts API**
   - Created `useContacts` hook in `src/hooks/useContacts.ts`
   - Provides CRUD operations for contacts
   - Handles loading states and errors

2. **Updated Contacts Page**
   - Modified `src/app/(app)/contacts/page.tsx` to use the `useContacts` hook
   - Removed dependency on mock data
   - Added loading and error states

3. **Updated New Contact Page**
   - Modified `src/app/(app)/contacts/new/page.tsx` to use the API
   - Contacts are now saved to MongoDB Atlas

4. **Added Import Script**
   - Added `src/scripts/import-mock-data.js` to import mock data into MongoDB
   - Added npm script `db:import-mock` to run the import

## How to Use

### Setup
1. Ensure MongoDB Atlas is connected (check `.env.local`)
2. Start the application: `npm run dev`

### Import Mock Data (First Time Setup)
Run the following command to import mock data into MongoDB:
```bash
npm run db:import-mock
```

### View Contacts
1. Navigate to `/contacts` to see contacts loaded from MongoDB
2. The application uses a mock user with ID `user1` which matches the mock data

### Add a Contact
1. Click "Add New Contact" on the contacts page
2. Fill in the contact details
3. Submit the form - the contact will be saved to MongoDB Atlas

## API Endpoints

- **GET /api/contacts?ownerId={ownerId}** - Get all contacts for a user
- **POST /api/contacts** - Create a new contact
- **GET /api/contacts/{id}** - Get a contact by ID
- **PATCH /api/contacts/{id}** - Update a contact
- **DELETE /api/contacts/{id}** - Delete a contact
- **GET /api/contacts/search** - Search contacts by query, tag, or category
- **PUT /api/contacts?importMock=true** - Import mock data into MongoDB

## Troubleshooting

If contacts are not loading:
1. Check the MongoDB Atlas connection in `.env.local`
2. Ensure the database has been seeded with data
3. Check browser console for API errors
4. Verify that the user is authenticated (contacts are associated with users) 