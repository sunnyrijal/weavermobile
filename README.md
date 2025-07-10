# NetworkNest - Intelligent Relationship Management Platform

NetworkNest is a comprehensive, AI-powered relationship management platform that transforms static contacts into a dynamic, explorable, and searchable network. Built with Next.js, TypeScript, and MongoDB, it provides an intuitive interface for managing personal and professional relationships with powerful AI-driven features.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/signup with email/password and OAuth support
- **Contact Management**: Full CRUD operations with rich contact profiles
- **Interactive Relationship Tree**: Visual mapping of contacts and relationships with pan/zoom
- **Unified Contact Import**: OAuth-based import from Google Contacts, LinkedIn, etc.
- **AI-Powered Features**: Voice/text input for memory parsing and natural language queries

### AI Features
- **Add New Memory**: Voice and text input to parse unstructured memories into contact information
- **Ask AI**: Natural language queries about contacts (e.g., "Who is John's wife?")
- **Duplicate Detection**: Intelligent detection and merging of duplicate contacts
- **Memory Management**: Store and retrieve memories linked to contacts

### Advanced Features
- **Relationship Mapping**: Visual tree view with drag-and-drop functionality
- **Contact Categories**: Organize contacts by family, friends, colleagues, etc.
- **Tag System**: Flexible tagging for easy organization
- **Export/Import**: Data portability with JSON export
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js (Next.js API routes)
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: Google Genkit for natural language processing
- **Authentication**: Custom auth system with OAuth support
- **UI Components**: Shadcn/ui component library
- **Deployment**: Docker support with docker-compose

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/networknest
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/networknest

# AI Configuration (if using external AI services)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Authentication (if using external auth providers)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Start MongoDB (if using local instance)
mongod

# Or use Docker
docker-compose up -d
```

### 5. Seed the Database (Optional)
```bash
npm run seed
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build the image
docker build -t networknest .

# Run the container
docker run -p 3000:3000 networknest
```

## 📁 Project Structure

```
studio/
├── src/
│   ├── ai/                    # AI flows and processing
│   │   ├── flows/            # Genkit AI flows
│   │   └── genkit.ts         # AI configuration
│   ├── app/                   # Next.js app router
│   │   ├── (app)/            # Protected app routes
│   │   ├── (auth)/           # Authentication routes
│   │   └── api/              # API endpoints
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── contacts/         # Contact management components
│   │   ├── layout/           # Layout components
│   │   ├── memory/           # Memory management components
│   │   ├── providers/        # Context providers
│   │   ├── shared/           # Shared components
│   │   └── ui/               # UI components (shadcn/ui)
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── actions/          # Server actions
│   │   ├── firebase/         # Firebase configuration
│   │   ├── mongodb/          # MongoDB models and services
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils.ts          # Utility functions
│   └── scripts/              # Database scripts
├── docs/                     # Documentation
├── docker-compose.yml        # Docker configuration
├── Dockerfile               # Docker build file
└── package.json             # Dependencies and scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Contacts
- `GET /api/contacts` - Get all contacts for user
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get specific contact
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact
- `GET /api/contacts/search` - Search contacts
- `GET /api/contacts/duplicates` - Find duplicate contacts
- `POST /api/contacts/merge` - Merge duplicate contacts

### AI Features
- `POST /api/ai/ask` - Ask AI about contacts
- `POST /api/ai/parse-memory` - Parse memory input

### Memories
- `GET /api/memories` - Get all memories for user
- `POST /api/memories` - Create new memory
- `GET /api/memories/[id]` - Get specific memory
- `PATCH /api/memories/[id]` - Update memory
- `DELETE /api/memories/[id]` - Delete memory
- `GET /api/memories/search` - Search memories

### Import/Export
- `GET /api/contacts/import/google` - Import from Google Contacts
- `POST /api/contacts/import/google` - Save imported contacts

## 🎯 Key Features Explained

### 1. Interactive Relationship Tree
The relationship tree view provides a visual representation of your contact network:
- **Pan and Zoom**: Navigate large networks easily
- **Drag and Drop**: Reposition contacts for better organization
- **Hover Information**: Quick access to contact details
- **Click to Edit**: Direct access to contact profiles

### 2. AI-Powered Memory Management
Add memories using voice or text input:
- **Voice Input**: Use your microphone to record memories
- **Text Input**: Type memories manually
- **AI Parsing**: Automatically extract contact information and relationships
- **Memory Linking**: Connect memories to specific contacts

### 3. Natural Language Queries
Ask questions about your contacts using natural language:
- "Who is John's wife?"
- "When is Alice's birthday?"
- "What's Sam's phone number?"
- "Where does Jane work?"
- "Tell me about John Doe"

### 4. Duplicate Detection and Merging
Intelligent duplicate detection with merge capabilities:
- **Automatic Detection**: Find similar contacts based on names
- **Manual Review**: Review and approve merges
- **Smart Merging**: Combine contact information intelligently
- **Relationship Preservation**: Maintain existing relationships

### 5. Contact Import
Import contacts from various sources:
- **Google Contacts**: OAuth-based import
- **LinkedIn**: Professional network import
- **CSV Files**: Manual import from spreadsheets
- **Manual Entry**: Add contacts one by one

## 🔒 Security Features

- **Data Encryption**: All data encrypted in transit and at rest
- **User Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **Session Management**: Secure session handling

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📊 Performance

- **Database Optimization**: Indexed queries for fast retrieval
- **Caching**: Redis caching for frequently accessed data
- **Image Optimization**: Automatic image compression and optimization
- **Lazy Loading**: Components load on demand
- **CDN Ready**: Static assets optimized for CDN delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/troubleshooting.md)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ User authentication
- ✅ Contact CRUD operations
- ✅ Basic AI features
- ✅ Relationship mapping
- ✅ Import/export functionality

### Phase 2 (Planned)
- 🔄 Mobile application
- 🔄 Advanced AI features
- 🔄 Social media integration
- 🔄 Calendar integration
- 🔄 Advanced analytics

### Phase 3 (Future)
- 🔮 AR/VR integration
- 🔮 Advanced machine learning
- 🔮 Enterprise features
- 🔮 API for third-party integrations

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Google Genkit](https://genkit.dev/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**NetworkNest** - Transform your contacts into a living, breathing network of relationships.
