# ExamRedi Backend

This is the Node.js, Express, and TypeScript backend for the ExamRedi application.

## Features

-   **JWT Authentication**: Secure user registration and login.
-   **RESTful API**: Endpoints for fetching questions, guides, user data, and more.
-   **Secure Gemini API Proxy**: All AI-related calls are proxied through the backend to protect the API key.
-   **File-based Database**: Simple JSON files for data persistence, easily migratable to a full database.

## Setup Instructions

1.  **Install Dependencies**:
    Navigate to the `backend` directory and run:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the `backend` root by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and add your credentials:
    -   `API_KEY`: Your Google Gemini API key.
    -   `JWT_SECRET`: A long, random, and secret string for signing tokens.

3.  **Running the Server**:
    To run the server in development mode with auto-reloading (thanks to `nodemon`):
    ```bash
    npm run dev
    ```
    The server will start, typically on `http://localhost:5000`.

## API Endpoints

-   `POST /api/auth/register` - Register a new user.
-   `POST /api/auth/login` - Login a user, returns a JWT.
-   `GET /api/data/papers` - Get past papers (can be filtered with query params).
-   `GET /api/data/guides` - Get all study guides.
-   `GET /api/data/leaderboard` - Get UTME Challenge leaderboard.
-   `POST /api/data/leaderboard` - Add a new score to the leaderboard (protected).
-   `GET /api/data/performance` - Get user's quiz results (protected).
-   `POST /api/data/performance` - Save a new quiz result (protected).
-   `POST /api/ai/chat` - Send a message to the AI Tutor (protected).
-   `POST /api/ai/generate-guide` - Generate a new study guide (protected).
-   `POST /api/ai/research` - Research a course or university (protected).

All protected routes require an `Authorization: Bearer <token>` header.
