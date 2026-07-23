# NetworkNest - Complete User Workflows

This document provides detailed, step-by-step workflows for all features in NetworkNest. Use this as a guide for designing layouts, creating demos, and understanding the complete user journey.

---

## Table of Contents

1. [User Authentication & Onboarding](#1-user-authentication--onboarding)
2. [Adding a Contact (Manual)](#2-adding-a-contact-manual)
3. [Adding a Memory (Voice/Text) & AI Parsing](#3-adding-a-memory-voicetext--ai-parsing)
4. [Asking AI About Contacts](#4-asking-ai-about-contacts)
5. [Managing Reminders & Upcoming Events](#5-managing-reminders--upcoming-events)
6. [Journal Features](#6-journal-features)
7. [Importing Contacts](#7-importing-contacts)
8. [Viewing & Managing Contacts](#8-viewing--managing-contacts)
9. [Relationship Mapping](#9-relationship-mapping)
10. [Contact Details & Editing](#10-contact-details--editing)
11. [Dashboard Overview](#11-dashboard-overview)

---

## 1. User Authentication & Onboarding

### 1.1 Sign Up Flow

**Steps:**
1. User navigates to `/signup` page
2. User sees signup form with:
   - Email input field
   - Password input field (with show/hide toggle)
   - Confirm password field
   - "Sign Up" button
   - Link to login page ("Already have an account? Log in")
3. User enters email and password
4. System validates:
   - Email format
   - Password strength (min 6 characters)
   - Password confirmation match
5. On successful validation:
   - User account is created
   - User is automatically logged in
   - User is redirected to `/dashboard`
6. On error:
   - Error message displayed below form
   - User can retry

**UI Elements:**
- Clean form layout
- Validation error messages
- Loading state on submit button
- Success toast notification

---

### 1.2 Login Flow

**Steps:**
1. User navigates to `/login` page
2. User sees login form with:
   - Email input field
   - Password input field (with show/hide toggle)
   - "Log In" button
   - Link to signup page ("Don't have an account? Sign up")
   - Optional: "Forgot Password?" link
3. User enters credentials
4. System validates credentials
5. On success:
   - User session is created
   - User is redirected to `/dashboard`
6. On error:
   - Error message: "Invalid email or password"
   - User can retry

**UI Elements:**
- Simple, centered form
- Error state handling
- Loading state during authentication

---

## 2. Adding a Contact (Manual)

### 2.1 Navigate to Add Contact

**Steps:**
1. User is on Dashboard (`/dashboard`) or Contacts page (`/contacts`)
2. User clicks "Add Contact" button (Plus icon + "New Contact" text)
3. User is navigated to `/contacts/new`

---

### 2.2 Fill Contact Form

**Steps:**
1. User sees contact form with multiple sections:

   **Basic Information:**
   - Name fields:
     - First Name (optional but recommended)
     - Middle Name (optional)
     - Last Name (optional but recommended)
     - Preferred Name/Nickname (optional)
   - Photo:
     - Upload photo button (file picker)
     - OR photo URL input field
     - Preview of selected photo
     - Max file size: 2MB
     - Supported formats: JPG, JPEG, PNG, GIF, WebP

   **Contact Details:**
   - Email address (with email validation)
   - Phone number
   - Category dropdown:
     - Family
     - Friend
     - Colleague
     - Professional
     - Partner
     - Other
     - Pet
   - Owner Relationship Label (free text):
     - Example: "Host Mom", "Mentor", "Childhood Friend"

   **Professional Information:**
   - Occupation
   - Company
   - College/University
   - Major/Field of Study

   **Location:**
   - Hometown
   - Current Location

   **Personal Details:**
   - Birthday:
     - Calendar picker (date picker)
     - Year, Month, Day selection
   - Gender dropdown:
     - Male
     - Female
     - Other
     - (Optional)

   **Additional Information:**
   - Tags (comma-separated):
     - Example: "tennis, accounting, CPA"
   - Notes (textarea):
     - Free-form text area for additional information

   **Relationships (Optional):**
   - "Add Relationship" button
   - Relationship form appears:
     - Related Contact dropdown (select from existing contacts)
     - Relationship Type dropdown:
       - Partner
       - Parent
       - Sibling
       - Child
       - Friend
       - Colleague
       - Custom (with custom label field)
     - "Save Relationship" button
   - List of added relationships (can be removed)

2. User fills in desired fields
   - At minimum: First Name OR Last Name is required
   - All other fields are optional

3. Form validation:
   - Real-time validation for email format
   - Required field indicators
   - Error messages for invalid inputs

---

### 2.3 Submit Contact

**Steps:**
1. User clicks "Save Contact" button (bottom of form)
2. System validates:
   - At least First Name OR Last Name provided
   - Email format (if provided)
   - Photo file size and format (if uploaded)
3. Loading state:
   - Button shows loading spinner
   - Form is disabled
4. On success:
   - Contact is created in database
   - Contact count is updated
   - Success toast: "Contact [Name] added successfully"
   - User is redirected to contact detail page (`/contacts/[contactId]`)
5. On error:
   - Error toast with specific message
   - Form remains editable
   - User can correct and retry

**UI Elements:**
- Submit button (primary color, full-width on mobile)
- Loading spinner during save
- Success/error toast notifications
- Form validation feedback

---

### 2.4 Example: Adding "John Smith"

**User Input:**
- First Name: "John"
- Last Name: "Smith"
- Email: "john.smith@example.com"
- Phone: "+1-555-123-4567"
- Category: "Friend"
- Occupation: "Software Engineer"
- Company: "Tech Corp"
- Current Location: "San Francisco, CA"
- Birthday: March 15, 1990
- Notes: "Met at tech conference. Loves hiking."

**Result:**
- Contact created with ID
- Appears in contacts list
- Can be viewed, edited, or deleted

---

## 3. Adding a Memory (Voice/Text) & AI Parsing

### 3.1 Access Memory Input

**Steps:**
1. User can access memory input from multiple places:
   - Dashboard: "Add Memory" button (microphone icon)
   - Journal page: "New Entry" button
   - Contact detail page: "Add Memory" button
2. Modal opens: `VoiceMemoryInputModal`

---

### 3.2 Voice Input Flow

**Steps:**
1. User clicks microphone icon in modal
2. Browser requests microphone permission (if first time)
3. User grants permission
4. Recording starts:
   - Microphone icon animates (pulsing)
   - "Recording..." text appears
   - Real-time transcript appears (if supported)
5. User speaks their memory:
   - Example: "I met Jake, my freshman year of college. Same dorm building (pittman), he is from Kansas, but now lives in Minneapolis. He took accounting and is CPA now. His full name Jacob Lucas. His girlfriend Sydney. brother Marty Lucas. Plays tennis. birthday feb 25. he is 23 yrs old."
6. User clicks stop button (or recording auto-stops after timeout)
7. Transcript appears in text area
8. User can:
   - Edit transcript manually
   - Re-record
   - Proceed to parsing

---

### 3.3 Text Input Flow

**Steps:**
1. User types directly into text area
2. User can paste text from clipboard
3. Text area supports multi-line input
4. Character count displayed (optional)

---

### 3.4 Process Memory (AI Parsing)

**Steps:**
1. User clicks "Process Memory" or "Parse" button
2. Loading state:
   - Button shows spinner
   - "Processing with AI..." message
   - Modal content dims slightly
3. System sends transcript to AI parsing API:
   - `/api/ai/parse-memory` (basic parsing)
   - OR `/api/ai/parse-advanced-memory` (advanced parsing with Gemini CLI)
4. AI extracts information:
   - **People mentioned**: Names, nicknames
   - **Contact information**: Phone, email, location
   - **Relationships**: Family, friends, partners
   - **Personal details**: Age, birthday, occupation, college
   - **Events**: Birthdays, anniversaries, meetings
   - **Notes**: Additional context

5. Results displayed in modal:

   **Extracted Contacts Section:**
   - List of people found in memory
   - For each person:
     - Name (with nickname if detected)
     - Extracted fields (occupation, location, etc.)
     - Match status:
       - "New Contact" (red badge) - will be created
       - "Matches [Existing Contact Name]" (green badge) - will be updated
       - "Potential Match" (yellow badge) - user can confirm
     - Checkbox to include/exclude
     - "Edit" button to modify extracted data

   **Contact Updates Section:**
   - List of existing contacts that will be updated
   - Shows what fields will be updated
   - User can review and modify

   **New Contacts to Create:**
   - List of new contacts extracted
   - User can:
     - Edit contact details before creation
     - Remove contacts they don't want to create
     - Add additional fields manually

   **Relationships Detected:**
   - Shows detected relationships between people
   - Example: "Jacob Lucas" → "Sydney" (Partner)
   - User can confirm or modify relationships

   **Events Detected:**
   - Birthdays, anniversaries, meetings
   - User can confirm or remove events

---

### 3.5 Review & Confirm Parsing Results

**Steps:**
1. User reviews all extracted information
2. User can:
   - Edit any contact details
   - Remove contacts they don't want
   - Confirm relationships
   - Adjust events
3. User selects which contacts to link memory to:
   - Checkboxes next to each contact
   - Can select multiple
4. User clicks "Save Memory & Create Contacts" button

---

### 3.6 Save Memory & Create Contacts

**Steps:**
1. System processes the save:
   - Creates new contacts (if any)
   - Updates existing contacts (if any)
   - Creates relationships (if any)
   - Adds events to contacts (if any)
   - Saves memory to database
   - Saves journal entry (automatically)
   - Links memory to selected contacts

2. Progress indicators:
   - "Creating contacts..." (if new contacts)
   - "Updating contacts..." (if updates)
   - "Saving memory..." (final step)

3. On success:
   - Success toast: "Memory saved! X contacts created, Y contacts updated."
   - Modal closes
   - User is redirected to:
     - Journal page (to see entry)
     - OR Contact detail page (if single contact)
     - OR Dashboard (if multiple contacts)

4. On error:
   - Error toast with details
   - User can retry or cancel

---

### 3.7 Example: Voice Memory Input

**User speaks:**
> "I met Jake, my freshman year of college. Same dorm building (pittman), he is from Kansas, but now lives in Minneapolis. He took accounting and is CPA now. His full name Jacob Lucas. His girlfriend Sydney. brother Marty Lucas. Plays tennis. birthday feb 25. he is 23 yrs old."

**AI Parsing Results:**

**New Contacts to Create:**
1. **Jacob Lucas**
   - Nickname: "Jake"
   - Occupation: "CPA"
   - Hometown: "Kansas"
   - Current Location: "Minneapolis"
   - Birthday: "2002-02-25" (calculated from age 23)
   - College: "college" (from context)
   - Tags: ["tennis", "accounting", "CPA"]
   - Relationships:
     - Partner: Sydney
     - Sibling: Marty Lucas

2. **Sydney**
   - Category: "Partner"
   - Relationship to Jacob Lucas: "Partner"

3. **Marty Lucas**
   - Category: "Family"
   - Relationship to Jacob Lucas: "Sibling"

**Memory Saved:**
- Original transcript stored
- Linked to: Jacob Lucas, Sydney, Marty Lucas
- Journal entry created automatically
- Category: "New Contact"

---

## 4. Asking AI About Contacts

### 4.1 Access AI Ask Feature

**Steps:**
1. User can access from:
   - Dashboard: AI question input box (top of page)
   - Global search: "Ask AI" button
   - Contact detail page: "Ask about this contact" button
2. Modal opens: `AIAskModal` (if from button)
   - OR inline input on dashboard

---

### 4.2 Enter Question

**Steps:**
1. User sees input field with placeholder:
   - "Ask me anything about your contacts..."
2. User can:
   - Type question directly
   - Click microphone icon for voice input
3. Voice input flow:
   - Click microphone
   - Browser requests permission (if needed)
   - User speaks question
   - Transcript appears in input field
   - User can edit transcript

---

### 4.3 Submit Question

**Steps:**
1. User types or speaks question
2. Examples of questions:
   - "Who is John's wife?"
   - "When is Alice's birthday?"
   - "What's Sam's phone number?"
   - "Where does Jane work?"
   - "Tell me about John Doe"
   - "Who do I know in Seattle?"
   - "How old is Alice?"
   - "What is Jake's occupation?"
   - "Who is Jacob Lucas's girlfriend?"

3. User clicks "Ask" button or presses Enter
4. Loading state:
   - Input shows spinner
   - "Thinking..." message
   - Button disabled

---

### 4.4 AI Processing

**Steps:**
1. System sends question to `/api/ai/ask`
2. API:
   - Fetches all user's contacts
   - Enriches contact data (relationships, etc.)
   - Sends to AI model (Google Genkit)
   - AI analyzes question against contact data
   - Returns answer

3. AI response formatting:
   - For general questions: Full profile format
   - For specific questions: Concise answer
   - For location questions: List with detailed profiles
   - For relationship questions: Bidirectional answers

---

### 4.5 Display Answer

**Steps:**
1. Answer appears in modal or below input
2. Answer format examples:

   **General Question: "Tell me about Alice"**
   ```
   Name: Alice
   Age: 22 years old
   Birthday: 2001-08-01
   Job: Software Engineer
   Company: Tech Solutions Inc.
   Hometown: Portland, OR
   Current Location: Seattle, WA
   Major: Computer Science
   Relationship: My college roommate
   Notes: Ally likes to go on vacation, especially Kayaking and sailing.
   Relationships: None
   ```

   **Specific Question: "When is Alice's birthday?"**
   ```
   Alice's birthday: August 1, 2001
   ```

   **Relationship Question: "Who is John's wife?"**
   ```
   John's wife: Sarah Johnson
   ```

   **Location Question: "Who do I know in Seattle?"**
   ```
   Ally is in Seattle.

   Ally's profile:
   Name: Ally
   Age: 22 years old
   Birthday: 2001-08-01
   Job: Software Engineer
   Company: Tech Solutions Inc.
   Hometown: Portland, OR
   Current Location: Seattle, WA
   ...
   ```

3. Answer is formatted with:
   - Proper line breaks
   - Clickable contact names (links to contact detail)
   - Highlighted key information

4. User can:
   - Copy answer
   - Ask follow-up question
   - Close modal

---

### 4.6 Example: Asking "Who is Jacob Lucas's girlfriend?"

**User Action:**
- Types: "Who is Jacob Lucas's girlfriend?"
- Clicks "Ask" button

**AI Processing:**
- Searches contacts for "Jacob Lucas"
- Finds relationship: Partner → Sydney
- Returns answer

**Answer Displayed:**
```
Jacob Lucas's girlfriend: Sydney
```

**If user clicks on "Sydney":**
- Navigates to Sydney's contact detail page

---

## 5. Managing Reminders & Upcoming Events

### 5.1 Access Reminders

**Steps:**
1. User navigates to:
   - Contact detail page → "Reminders" tab
   - Dashboard → "Upcoming Reminders" section
   - Settings → "Reminders" section
2. Reminder manager component loads: `ReminderManager`

---

### 5.2 View Upcoming Reminders

**Steps:**
1. System displays reminders grouped by:
   - **Upcoming (Next 30 Days)**: Active reminders
   - **All Reminders**: Complete list including past
2. Each reminder shows:
   - Icon (based on type):
     - 🎂 Birthday
     - 💍 Anniversary
     - 📞 Call
     - 🤝 Meeting
     - 🎁 Gift
     - 📅 Custom
   - Title
   - Contact name
   - Date (formatted: "MMM dd, yyyy")
   - Description (if provided)
   - Lead time badge (e.g., "3 days before")
   - Completion checkbox
3. Reminders sorted by date (soonest first)

---

### 5.3 Create New Reminder

**Steps:**
1. User clicks "Add Reminder" button (Plus icon)
2. Dialog opens with reminder form:

   **Basic Information:**
   - Title (required): Free text
   - Contact (dropdown): Select from contacts
   - Type (dropdown):
     - Birthday
     - Anniversary
     - Call
     - Meeting
     - Gift
     - Custom
   - Date (date picker): Required
   - Description (textarea): Optional

   **Notification Settings:**
   - Lead Time (number input): Days before event
     - Default: 1 day
     - Range: 0-30 days
   - Notification Preferences (checkboxes):
     - ☑ Email
     - ☑ Push Notification
     - ☐ SMS

   **Recurring (Optional):**
   - ☑ Recurring reminder
   - Frequency (dropdown):
     - Yearly
     - Monthly
     - Weekly
     - Custom
   - Interval (if custom): Number input

3. User fills form
4. User clicks "Create Reminder" button
5. System validates:
   - Title required
   - Contact selected
   - Date selected
6. On success:
   - Reminder created
   - Success toast: "Reminder created"
   - Dialog closes
   - Reminder appears in list
7. On error:
   - Error message displayed
   - User can retry

---

### 5.4 Edit Reminder

**Steps:**
1. User clicks "Edit" button on reminder card
2. Same form opens with pre-filled data
3. User modifies fields
4. User clicks "Update Reminder" button
5. Reminder is updated
6. Success toast displayed

---

### 5.5 Complete Reminder

**Steps:**
1. User clicks checkbox on reminder
2. Reminder marked as completed
3. Reminder moves to "Completed" section
4. Checkbox shows checked state
5. User can uncheck to reactivate

---

### 5.6 Delete Reminder

**Steps:**
1. User clicks "Delete" button (trash icon)
2. Confirmation dialog: "Are you sure you want to delete this reminder?"
3. User confirms
4. Reminder deleted
5. Success toast: "Reminder deleted"

---

### 5.7 Automatic Reminder Creation

**Steps:**
1. When contact is created/updated with birthday:
   - System automatically creates birthday reminder
   - Recurring: Yearly
   - Lead time: 7 days (default)
   - User can edit or delete

2. When relationship is added (e.g., Partner):
   - User can manually create anniversary reminder
   - System suggests creating reminder

---

### 5.8 Example: Creating Birthday Reminder

**User Action:**
- Navigates to "John Smith" contact detail page
- Clicks "Reminders" tab
- Clicks "Add Reminder"

**Form Input:**
- Title: "John's Birthday"
- Contact: "John Smith" (pre-selected)
- Type: "Birthday"
- Date: March 15, 2025
- Description: "Don't forget to call!"
- Lead Time: 7 days
- Notifications: Email ☑, Push ☑
- Recurring: ☑ Yearly

**Result:**
- Reminder created
- Appears in "Upcoming Reminders" section
- User will receive notification 7 days before March 15

---

## 6. Journal Features

### 6.1 Access Journal

**Steps:**
1. User navigates to `/journal` page
2. Journal page loads with:
   - Header: "My Journal" with book icon
   - "New Entry" button (top right)
   - Mood overview statistics
   - Journal entries list

---

### 6.2 View Journal Entries

**Steps:**
1. Entries displayed in cards:
   - Each entry shows:
     - Mood icon and badge (Happy, Sad, Energetic, Grateful, Neutral)
     - Category badge (if applicable):
       - "New Contact" (blue)
       - "Contact Update" (green)
       - "General Memory" (default)
     - Timestamp: Date and time
     - Content preview (truncated)
     - Linked contacts count (if any)
     - Tags (if any)
     - Delete button

2. Entries sorted by date (newest first)

3. Filter tabs:
   - **All**: All entries
   - **Updates**: Contact Update entries
   - **New**: New Contact entries
   - **Happy**: Happy mood entries
   - **Sad**: Sad mood entries
   - **Energetic**: Energetic mood entries
   - **Grateful**: Grateful mood entries
   - **Neutral**: Neutral mood entries

---

### 6.3 View Mood Statistics

**Steps:**
1. Mood overview section shows:
   - 5 mood cards in grid:
     - Happy (green)
     - Sad (blue)
     - Energetic (orange)
     - Grateful (pink)
     - Neutral (gray)
   - Each card shows:
     - Mood icon
     - Mood name
     - Count of entries with that mood

2. Cards are clickable:
   - Clicking filters entries by that mood

---

### 6.4 Create Journal Entry

**Steps:**
1. User clicks "New Entry" button
2. `VoiceMemoryInputModal` opens (same as memory input)
3. User can:
   - Record voice memory
   - Type text memory
   - Process with AI
4. When memory is saved:
   - Journal entry is automatically created
   - Entry linked to contacts (if any)
   - Mood is auto-detected (if not provided)
   - Category is set:
     - "New Contact" if new contacts created
     - "Contact Update" if contacts updated
     - "General Memory" otherwise

---

### 6.5 View Journal Entry Details

**Steps:**
1. User clicks on journal entry card
2. Modal opens with full entry:
   - Mood badge
   - Full timestamp
   - Complete content (original text)
   - Linked contacts (clickable)
   - Tags (if any)
3. User can:
   - Read full content
   - Click linked contacts to navigate
   - Close modal

---

### 6.6 Delete Journal Entry

**Steps:**
1. User clicks trash icon on entry card
2. Confirmation dialog: "Are you sure you want to delete this journal entry? This action cannot be undone."
3. User confirms
4. Entry deleted
5. Entry removed from list
6. Mood statistics updated

---

### 6.7 Automatic Journal Entry Creation

**When entries are created automatically:**

1. **When memory is saved:**
   - Memory → Journal entry
   - Original content preserved
   - Linked contacts included
   - Mood detected
   - Category set

2. **When contact is created:**
   - Optional: Create journal entry
   - Category: "New Contact"

3. **When contact is updated:**
   - Optional: Create journal entry
   - Category: "Contact Update"

---

### 6.8 Example: Journal Entry from Memory

**User Action:**
- Records voice memory about meeting Jacob Lucas
- AI parses and creates contacts
- Memory is saved

**Journal Entry Created:**
- **Content**: Original voice transcript
- **Category**: "New Contact" (because new contacts were created)
- **Mood**: "Happy" (auto-detected from positive language)
- **Linked Contacts**: Jacob Lucas, Sydney, Marty Lucas
- **Tags**: ["college", "friend", "tennis"]
- **Timestamp**: Current date and time

**Display:**
- Appears in "All" tab
- Appears in "New" tab (category filter)
- Appears in "Happy" tab (mood filter)
- Shows mood icon (smile)
- Shows "New Contact" badge
- Shows 3 linked contacts

---

## 7. Importing Contacts

### 7.1 Access Import Page

**Steps:**
1. User navigates to `/import` page
   - OR clicks "Import Contacts" from dashboard
2. Import page loads with:
   - Header: "Import Contacts"
   - Source selection cards
   - Import progress (if in progress)

---

### 7.2 Select Import Source

**Steps:**
1. User sees import source options:

   **Google Contacts:**
   - Card with Google icon
   - "Import from Google" button
   - Description: "Sync your Google Contacts"

   **Phone Contacts:**
   - Card with phone icon
   - "Import from Phone" button
   - Description: "Import from device address book"

2. User clicks desired source

---

### 7.3 Google Contacts Import

**Steps:**
1. User clicks "Import from Google"
2. OAuth flow:
   - Redirects to Google OAuth consent screen
   - User grants permissions
   - Redirects back to app with auth code
3. System fetches contacts from Google People API
4. Contacts displayed in preview:
   - List of contacts with checkboxes
   - Each contact shows:
     - Name
     - Email
     - Phone
     - Photo (if available)
   - "Select All" checkbox
   - "Deselect All" button
5. User selects contacts to import
6. User clicks "Import Selected" button
7. Progress bar shows import status
8. On completion:
   - Success toast: "X contacts imported successfully"
   - User redirected to contacts page
   - Imported contacts appear in list

---

### 7.4 Phone Contacts Import

**Steps:**
1. User clicks "Import from Phone"
2. Browser requests contact picker permission
3. User grants permission
4. Contact picker opens (native browser/device UI)
5. User selects contacts from device
6. Selected contacts displayed in preview
7. User reviews contacts
8. User clicks "Import Selected" button
9. Contacts imported
10. Success toast displayed

---

### 7.5 Handle Duplicates

**Steps:**
1. During import, system checks for duplicates:
   - Compares names
   - Compares emails
   - Compares phone numbers
2. If duplicates found:
   - User sees "Duplicate Detection" section
   - Shows potential matches:
     - Existing contact: "John Smith"
     - Imported contact: "John Smith"
     - Match confidence: "High"
   - User can:
     - Merge (combine information)
     - Skip (don't import)
     - Import as new (create duplicate)
3. User makes selection for each duplicate
4. Import proceeds

---

### 7.6 Example: Importing from Google

**User Action:**
- Clicks "Import from Google"
- Grants OAuth permissions
- 50 contacts fetched

**Preview:**
- 50 contacts displayed
- User selects 45 contacts (deselects 5)
- 3 duplicates detected:
  - "John Smith" (existing) vs "John Smith" (imported)
  - User chooses: Merge
  - "Jane Doe" (existing) vs "Jane Doe" (imported)
  - User chooses: Skip
  - "Bob Johnson" (existing) vs "Bob Johnson" (imported)
  - User chooses: Import as new

**Result:**
- 44 contacts imported (43 new + 1 merged)
- Success toast: "44 contacts imported successfully"
- Contacts appear in contacts list

---

## 8. Viewing & Managing Contacts

### 8.1 View Contacts List

**Steps:**
1. User navigates to `/contacts` page
2. Contacts page loads with:
   - Header: "Contacts"
   - View toggle buttons:
     - List view (icon)
     - Grid view (icon)
   - Search bar
   - Filter options:
     - Category filter (dropdown)
     - Sort options (dropdown)
   - "Add Contact" button
   - Contacts display area

---

### 8.2 List View

**Steps:**
1. User selects list view
2. Contacts displayed as list items:
   - Each item shows:
     - Avatar/photo (circular)
     - Name
     - Category/Occupation (subtitle)
     - Actions:
       - "View" button
       - More menu (three dots)
         - View Details
         - Edit Contact
         - Delete Contact
   - Items are clickable (navigate to detail page)

---

### 8.3 Grid View

**Steps:**
1. User selects grid view
2. Contacts displayed as cards:
   - Each card shows:
     - Photo (header image)
     - Name (title)
     - Category (badge)
     - Occupation/Company (if available)
     - Location (if available)
     - "View Details" button (footer)
     - More menu (hover, top right)
   - Cards in responsive grid:
     - Mobile: 1 column
     - Tablet: 2 columns
     - Desktop: 3-4 columns

---

### 8.4 Search Contacts

**Steps:**
1. User types in search bar
2. Real-time search:
   - Searches: Name, email, phone, occupation, company, notes
   - Results update as user types
   - Highlights matching text
3. Search results displayed immediately
4. "Clear search" button (X icon) appears
5. User clicks result to view contact

---

### 8.5 Filter Contacts

**Steps:**
1. User clicks category filter dropdown
2. Options:
   - All Categories
   - Family
   - Friend
   - Colleague
   - Professional
   - Partner
   - Other
   - Pet
3. User selects category
4. List filters to show only that category
5. Filter badge shows active filter
6. User can clear filter

---

### 8.6 Sort Contacts

**Steps:**
1. User clicks sort dropdown
2. Options:
   - Name (A-Z)
   - Name (Z-A)
   - Recently Added
   - Recently Updated
   - Category
3. User selects sort option
4. List re-sorts immediately

---

### 8.7 Bulk Actions

**Steps:**
1. User selects multiple contacts (checkboxes)
2. Bulk action bar appears:
   - "X selected" text
   - Actions:
     - Delete Selected
     - Export Selected
     - Add to Group (future feature)
3. User selects action
4. Confirmation dialog (for delete)
5. Action performed on all selected

---

## 9. Relationship Mapping

### 9.1 Access Relationship Map

**Steps:**
1. User navigates to `/map` page
   - OR clicks "View Relationship Map" from dashboard
2. Relationship map page loads

---

### 9.2 Select Central Contact

**Steps:**
1. User sees contact selector (search/command palette)
2. User types contact name or clicks dropdown
3. Contact selected as "central" contact
4. Map updates to show relationships

---

### 9.3 View Relationship Groups

**Steps:**
1. Relationships grouped by type:
   - **Self**: Central contact
   - **Partner**: Spouse, girlfriend, boyfriend
   - **Family**: Parents, siblings, children
   - **Friends**: Friends
   - **Colleagues**: Work relationships
   - **Other**: Other relationships

2. Each group shows:
   - Group name
   - Count badge (number of contacts)
   - Expand/collapse toggle
   - List of contacts in group

3. Each contact in group shows:
   - Avatar/photo
   - Name
   - Relationship label (if custom)
   - Clickable (navigates to contact detail)

---

### 9.4 Navigate Relationships

**Steps:**
1. User clicks on related contact
2. That contact becomes new central contact
3. Map updates to show their relationships
4. Breadcrumb trail shows navigation path
5. User can go back to previous contact

---

### 9.5 Visual Relationship Tree (Future)

**Note:** Currently implemented as grouped list. Future enhancement: Interactive tree visualization.

**Planned Features:**
- Interactive node graph
- Drag and drop to reposition
- Pan and zoom
- Click nodes to view details
- Hover for quick info
- Color-coded by relationship type

---

### 9.6 Example: Viewing Jacob Lucas's Relationships

**User Action:**
- Navigates to relationship map
- Selects "Jacob Lucas" as central contact

**Display:**
- **Self**: Jacob Lucas
- **Partner** (1):
  - Sydney
- **Family** (1):
  - Marty Lucas (Sibling)
- **Friends** (0):
  - (empty)

**User clicks "Sydney":**
- Sydney becomes central contact
- Map updates to show Sydney's relationships
- Shows: Jacob Lucas (Partner)

---

## 10. Contact Details & Editing

### 10.1 View Contact Details

**Steps:**
1. User clicks on contact (from list, grid, or search)
2. Navigates to `/contacts/[contactId]`
3. Contact detail page loads with:

   **Header Section:**
   - Photo (large, centered)
   - Name (large, bold)
   - Category badge
   - Quick actions:
     - Edit button
     - Delete button
     - Share button (future)

   **Tabs:**
   - **Overview**: Basic information
   - **Relationships**: Related contacts
   - **Memories**: Linked memories
   - **Reminders**: Upcoming events
   - **Activities**: Interaction history (future)

---

### 10.2 Overview Tab

**Displays:**
- **Contact Information:**
  - Email (clickable, opens email client)
  - Phone (clickable, opens phone dialer)
  - Address (if available)

- **Personal Details:**
  - Birthday (with age calculation)
  - Gender
  - Hometown
  - Current Location

- **Professional:**
  - Occupation
  - Company
  - College
  - Major

- **Additional:**
  - Tags (clickable, filters contacts)
  - Notes (full text)
  - Owner Relationship Label

- **Metadata:**
  - Created: Date
  - Last Updated: Date

---

### 10.3 Relationships Tab

**Displays:**
- List of relationships grouped by type
- Each relationship shows:
  - Related contact name (clickable)
  - Relationship type
  - Custom label (if any)
  - "View" button
- "Add Relationship" button
- Relationship form (when adding):
  - Select related contact
  - Select relationship type
  - Optional custom label
  - "Save" button

---

### 10.4 Memories Tab

**Displays:**
- List of memories linked to this contact
- Each memory shows:
  - Date/time
  - Content preview
  - "View Full" button
- "Add Memory" button
- Clicking memory opens full view

---

### 10.5 Reminders Tab

**Displays:**
- Upcoming reminders for this contact
- Past reminders (collapsed)
- "Add Reminder" button
- Reminder manager component

---

### 10.6 Edit Contact

**Steps:**
1. User clicks "Edit" button (top right)
2. Navigates to `/contacts/[contactId]/edit`
3. Same form as "Add Contact" but pre-filled
4. User modifies fields
5. User clicks "Save Changes" button
6. Contact updated
7. Success toast: "Contact updated successfully"
8. User redirected back to detail page
9. Updated information displayed

---

### 10.7 Delete Contact

**Steps:**
1. User clicks "Delete" button
2. Confirmation dialog:
   - "Are you sure you want to delete [Contact Name]?"
   - "This will also delete all associated memories and relationships."
   - "This action cannot be undone."
3. User confirms
4. Contact deleted
5. Success toast: "Contact deleted"
6. User redirected to contacts list
7. Contact removed from all views

---

## 11. Dashboard Overview

### 11.1 Dashboard Layout

**Sections (top to bottom):**

1. **Header:**
   - App logo/name
   - Global search bar
   - User menu (avatar dropdown)

2. **AI Ask Section:**
   - Input field: "Ask me anything about your contacts..."
   - Microphone button (voice input)
   - "Ask" button
   - Recent questions (if any)

3. **Quick Stats:**
   - Total contacts count
   - Recent memories count
   - Upcoming reminders count
   - Journal entries count

4. **Recent Contacts:**
   - Grid/list of recently added/updated contacts
   - "View All" link

5. **Upcoming Reminders:**
   - List of reminders in next 7 days
   - "View All" link

6. **Recent Memories:**
   - List of recent journal entries
   - "View All" link

7. **Quick Actions:**
   - "Add Contact" button
   - "Add Memory" button (voice icon)
   - "Import Contacts" button
   - "View Map" button

8. **Import Section:**
   - "Find Friends" card
   - Google Contacts import
   - Phone Contacts import

---

### 11.2 Dashboard Interactions

**Quick Actions:**
- Click "Add Contact" → Navigate to `/contacts/new`
- Click "Add Memory" → Open memory input modal
- Click "Import Contacts" → Navigate to `/import`
- Click "View Map" → Navigate to `/map`

**AI Ask:**
- Type question → Get instant answer
- Voice input → Transcribe and ask

**Navigation:**
- Click contact card → View contact detail
- Click reminder → View reminder details
- Click memory → View journal entry

---

## Additional Features & Workflows

### Duplicate Detection

**Steps:**
1. User navigates to contacts page
2. System automatically detects potential duplicates
3. "Duplicates Found" banner appears
4. User clicks banner
5. Duplicate manager opens:
   - Shows potential duplicates side-by-side
   - Match confidence score
   - Differences highlighted
6. User can:
   - Merge duplicates (combine information)
   - Mark as not duplicate
   - Ignore
7. On merge:
   - Contacts combined
   - Relationships preserved
   - Memories linked to merged contact

---

### Contact Export

**Steps:**
1. User navigates to settings
2. Clicks "Export Contacts" button
3. System generates JSON file
4. File downloads
5. Contains all contact data, relationships, memories

---

### Settings & Preferences

**Steps:**
1. User navigates to `/settings`
2. Settings page with sections:
   - **Profile**: Name, email, photo
   - **Preferences**: Theme, notifications
   - **Data**: Export, delete account
   - **Billing**: Subscription (if applicable)
3. User modifies settings
4. User clicks "Save" button
5. Settings updated

---

## Error Handling & Edge Cases

### Common Error Scenarios

1. **Network Error:**
   - Display: "Connection error. Please try again."
   - Retry button appears

2. **Validation Error:**
   - Display: Specific field error message
   - Highlight invalid field
   - Prevent submission

3. **Permission Denied:**
   - Microphone: "Microphone permission required"
   - Contacts: "Contact access permission required"
   - Show instructions to enable

4. **Rate Limit:**
   - AI parsing: "AI parsing limit reached. Upgrade to Pro."
   - Show upgrade button

5. **Empty State:**
   - No contacts: "Add your first contact"
   - No memories: "Record your first memory"
   - No reminders: "No upcoming reminders"

---

## Mobile Considerations

### Mobile-Specific Workflows

1. **Bottom Navigation:**
   - Dashboard
   - Contacts
   - Journal
   - Map
   - Settings

2. **Touch Targets:**
   - Minimum 44x44px
   - Adequate spacing

3. **Swipe Gestures:**
   - Swipe to delete (contacts, memories)
   - Pull to refresh

4. **Voice Input:**
   - Prominent microphone button
   - Large touch target

5. **Responsive Forms:**
   - Full-width inputs
   - Stacked layout
   - Large submit buttons

---

## Performance Considerations

### Loading States

- Skeleton loaders for lists
- Spinner for actions
- Progress bars for imports
- Optimistic UI updates

### Caching

- Contact list cached
- Recent memories cached
- Offline support (future)

---

## Conclusion

This document covers all major workflows in NetworkNest. Use it as a reference for:
- Designing UI layouts
- Creating user flow diagrams
- Building interactive demos
- Understanding feature interactions
- Planning new features

For technical implementation details, refer to the codebase and API documentation.

---

**Last Updated:** [Current Date]
**Version:** 1.0

