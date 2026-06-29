# ⚙️ Deadline Guardian Backend

This is the backend API for Deadline Guardian, built with Node.js, Express, and MongoDB. It houses the core Multi-Agent Orchestration logic that powers the intelligence of the application.

## 🚀 Key Features
- **Multi-Agent Orchestrator**: Uses `@google/genai` to simulate a team of agents (Planner, Realist, Risk, Coordinator) for dynamic task planning and re-planning.
- **Production-Grade Security**: 
  - `express-rate-limit` prevents API abuse and quota exhaustion.
  - `helmet` secures HTTP headers.
  - `zod` strictly validates all incoming authentication requests.
  - Custom JWT authentication + Google OAuth verifier.
- **Image Processing**: Integrates with Gemini 1.5 Flash Vision capabilities to automatically verify uploaded proof of task completion.
- **Graceful Degradation**: Contains mock fallback logic to keep the UI functional even if global Google AI quotas are exceeded during testing.

## 🛠️ Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

Create a `.env` file based on the provided `.env.example` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🏃‍♂️ Running the Server

```bash
npm run dev
```

The server will typically start on `http://localhost:5000`.
