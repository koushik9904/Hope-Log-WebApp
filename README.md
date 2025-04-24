# Hope Log

Hope Log is an advanced AI-powered journaling and mental wellness platform. It provides a comprehensive, personalized digital experience for mental health tracking, journaling, and personal growth.

## Features

- **AI-Enhanced Journaling**: Write journal entries or have conversational chats with the AI
- **Sentiment Analysis**: Track emotions and get insights on your mental state
- **Goal Setting and Tracking**: Set personal goals and monitor your progress
- **Mood Tracking**: Record and visualize your mood over time
- **Weekly Summaries**: Get AI-generated summaries of your journal entries
- **Guided Reflection**: Use AI-powered prompts to guide your journaling experience

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OAuth (Google) and local authentication
- **AI Integration**: OpenAI API for text generation and analysis
- **Payments**: PayPal integration for subscription management

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Set up the database: `npm run db:push`
5. Start the development server: `npm run dev`

## Environment Variables

To run this project, you will need to add the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key for OpenAI
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth
- `SESSION_SECRET`: Secret for session management

## Subscription Model

Hope Log offers a tiered subscription model:
- **Free Plan**: Basic journaling and limited AI analysis
- **Premium Plan**: Full access to all features, including unlimited AI conversations and advanced analytics

## Contributors

- Jazeel Jabbar (Project Lead)