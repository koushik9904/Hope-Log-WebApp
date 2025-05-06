# Hope Log Architecture

## 1. Overview

Hope Log is an AI-powered journaling web application designed to provide users with a conversational mental wellness experience. The platform helps users track emotions, set goals, and receive personalized insights through AI analysis of their journal entries.

Key features include:
- Conversational journaling with an AI assistant
- Journal entry management (create, view, edit, delete)
- Mood tracking and visualization
- AI-generated insights and sentiment analysis
- User authentication and subscription management

## 2. System Architecture

Hope Log follows a modern full-stack architecture with a clear separation between frontend and backend components:

### 2.1 Frontend Architecture

- **Framework**: Next.js with React and TypeScript
- **UI Components**: Custom components using Tailwind CSS and Radix UI primitives
- **State Management**: React Query for server state management
- **Routing**: Next.js App Router and Wouter for client-side routing
- **Styling**: Tailwind CSS with custom theme configurations

### 2.2 Backend Architecture

- **Framework**: Node.js with Express
- **API Layer**: RESTful API endpoints
- **Authentication**: Token-based authentication with OAuth support
- **AI Integration**: OpenAI API for conversational responses and sentiment analysis
- **Server Rendering**: Hybrid rendering with server components and client components

### 2.3 Database Architecture

- **Primary Database**: PostgreSQL 
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Relational schema for users, journal entries, subscriptions, and preferences
- **Connection**: NeonDB serverless Postgres connection

## 3. Key Components

### 3.1 Authentication System

- **Implementation**: Custom authentication system with session management
- **Features**: Email/password login, OAuth integration (Google), token-based sessions
- **Security**: Email verification, password hashing, secure token storage

### 3.2 Journaling Interface

- **Conversational UI**: Chat-like interface for interacting with AI
- **Editor**: Rich text editor for journal entries
- **Storage**: Entries are stored in PostgreSQL with relationship to user accounts
- **Privacy**: End-to-end encryption for journal content

### 3.3 AI Engine

- **Implementation**: Integration with OpenAI API
- **Features**: 
  - Contextual responses based on user's previous entries
  - Sentiment analysis of journal content
  - Personalized insights and recommendations
  - Retrieval Augmented Generation (RAG) for context-aware responses

### 3.4 Subscription Management

- **Payment Processing**: PayPal integration for subscription payments
- **Tiers**: Free and Premium subscription models
- **Features**: Subscription creation, management, and cancellation

### 3.5 Analytics Dashboard

- **Visualization**: Interactive charts for mood tracking and patterns
- **Insights**: AI-generated analysis of journaling patterns
- **Reporting**: Weekly summaries and trend analysis

## 4. Data Flow

### 4.1 User Authentication Flow

1. User registers or logs in via email/password or OAuth
2. Server validates credentials and issues JWT token
3. Token is stored client-side and included in subsequent requests
4. Protected routes check token validity before granting access

### 4.2 Journaling Flow

1. User creates a new entry or continues a conversation
2. Client sends message to server
3. Server processes with AI integration for analysis and response
4. Response is streamed back to client and displayed in real-time
5. Entry is stored in database with metadata (timestamp, sentiment, etc.)

### 4.3 Subscription Flow

1. User selects subscription plan
2. User is directed to PayPal checkout
3. Upon successful payment, subscription is created in database
4. User gains access to premium features
5. Subscription status is checked on protected premium routes

## 5. External Dependencies

### 5.1 Third-Party Services

- **AI Provider**: OpenAI API for natural language processing and generation
- **Payment Processing**: PayPal API for subscription management
- **Email Service**: SendGrid for transactional emails
- **Database Hosting**: NeonDB for PostgreSQL database

### 5.2 Key Libraries

- **UI Components**: Radix UI primitives with custom styling
- **Data Fetching**: Tanstack Query (React Query) for data fetching and caching
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Custom implementation with JWT
- **Visualization**: Custom charting for mood tracking and analytics

## 6. Deployment Strategy

### 6.1 Infrastructure

- **Hosting**: Vercel for frontend deployment
- **Runtime Environment**: Node.js for server-side operations
- **Database**: PostgreSQL via NeonDB serverless
- **Development Environment**: Replit for collaborative development

### 6.2 CI/CD Pipeline

- **Development Workflow**: Local development with hot reloading
- **Build Process**: Vite for frontend bundling, esbuild for server code
- **Deployment**: Automatic deployment via Vercel integration
- **Environment Variables**: Managed through deployment platform

### 6.3 Scaling Strategy

- **Database Scaling**: NeonDB serverless Postgres for automatic scaling
- **API Scaling**: Stateless design allows for horizontal scaling
- **Cache Layer**: Client-side caching via React Query reduces server load

## 7. Security Considerations

### 7.1 Data Protection

- **User Data**: End-to-end encryption for sensitive journal content
- **Authentication**: Secure token storage and transmission
- **API Security**: Rate limiting and input validation

### 7.2 Compliance

- **Privacy**: GDPR-compliant data handling procedures
- **Data Ownership**: Users maintain ownership of their journal data
- **Transparency**: Clear disclosure about AI usage and data processing

## 8. Future Architecture Considerations

- **Real-time Collaboration**: WebSocket integration for shared journaling
- **Mobile Applications**: Native mobile apps with shared codebase
- **Advanced Analytics**: Machine learning models for deeper pattern recognition
- **Offline Support**: Service workers for offline journal entry creation