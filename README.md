# Flashcard Backend API

A NestJS backend for the Flashcard application, using Firebase Admin SDK for authentication and Firestore database.

## Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled
- Firebase service account key file
- Google Gemini API key (for AI features)

## Setup

1. **Install dependencies:**
   ```bash
   cd flashcard-be
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in:
   - `FIREBASE_SERVICE_ACCOUNT_PATH` — path to your Firebase service account JSON key file
   - `GOOGLE_GENAI_API_KEY` — your Google Gemini API key
   - `PORT` — server port (default: 3001)

3. **Run in development:**
   ```bash
   npm run start:dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run start:prod
   ```

## API Endpoints

All endpoints are prefixed with `/api` and require a Firebase Auth Bearer token in the `Authorization` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/flashcards` | List flashcards (optional `?deckId=` filter) |
| POST | `/api/flashcards` | Create a flashcard |
| POST | `/api/flashcards/batch` | Create multiple flashcards |
| PATCH | `/api/flashcards/:id` | Update a flashcard |
| DELETE | `/api/flashcards/:id` | Delete a flashcard |
| GET | `/api/decks` | List decks |
| POST | `/api/decks` | Create a deck |
| PATCH | `/api/decks/:id` | Update a deck |
| DELETE | `/api/decks/:id` | Delete a deck (and its flashcards) |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/:id/checkin` | Check in to a task |
| GET | `/api/overviews` | List overviews |
| GET | `/api/overviews/:id` | Get overview with related tasks & flashcards |
| POST | `/api/overviews` | Create an overview |
| PATCH | `/api/overviews/:id` | Update an overview |
| DELETE | `/api/overviews/:id` | Delete an overview |
| GET | `/api/pomodoro` | Get pomodoro state |
| PUT | `/api/pomodoro` | Update pomodoro state |
| POST | `/api/ai/decompose` | Decompose flashcards into sub-questions |
| POST | `/api/ai/github-review` | Generate review questions from GitHub commits |

## Architecture

```
src/
├── main.ts                 # Bootstrap (CORS, prefix, validation)
├── app.module.ts           # Root module
├── config/
│   └── configuration.ts    # Environment config
├── firebase/
│   ├── firebase.module.ts  # Global Firebase module
│   └── firebase.service.ts # Firebase Admin init
├── auth/
│   ├── auth.module.ts
│   ├── auth.guard.ts       # Bearer token verification
│   └── auth.decorator.ts   # @CurrentUser() decorator
├── flashcards/             # CRUD for flashcards
├── decks/                  # CRUD for decks
├── tasks/                  # CRUD + check-in for tasks
├── overviews/              # CRUD with related data
├── pomodoro/               # Single-doc state management
└── ai/                     # Gemini AI integration
```
