# 🛡️ Deadline Guardian

Deadline Guardian is an advanced, AI-powered academic task manager and productivity orchestrator. Built with a highly sophisticated **Multi-Agent System**, it goes far beyond standard to-do lists by predicting failure, dynamically planning execution strategies, and automatically generating emergency schedules if you fall behind.

## 🌟 Hackathon Highlights

This project was built to max out the hackathon evaluation criteria:
- **Agentic Depth (20%)**: Implements a 4-tier autonomous agent architecture (Planner, Realist, Risk, Coordinator) that debates strategies before providing an execution plan. It includes a **Dynamic Re-planning** feature that tracks state and intelligently builds emergency plans when deadlines are missed.
- **Problem Solving & Impact (20%)**: Directly targets academic procrastination and burnout by providing structural, mathematical risk assessments of workloads.
- **Usage of Google Technologies (15%)**: Powered by the **Gemini 2.5 Flash** models (via `@google/genai`) for complex agentic reasoning.
- **Product Experience & Design (10%)**: Features a stunning, glassmorphism-inspired dark mode UI with interactive multi-agent chat timelines, built in React and TailwindCSS.
- **Security & Technical Implementation (10%)**: Includes strict rate-limiting, Helmet header protections, Zod schema validation, and secure authentication (Custom + Google OAuth).

## 🏛️ System Architecture

Deadline Guardian uses a decoupled client-server architecture:

1. **[Frontend (React + Vite)](./frontend/README.md)**: A beautiful, highly responsive Single Page Application.
2. **[Backend (Node.js + Express)](./backend/README.md)**: A robust REST API managing the agent orchestrator, MongoDB data persistence, and security middleware.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Google Gemini API Key
- Google OAuth Client ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Deadline_Guardian_Documents
   ```

2. **Set up the Backend**
   - Navigate to the `backend/` directory.
   - Run `npm install`.
   - Copy `.env.example` to `.env` and fill in your secrets.
   - Run `npm run dev` to start the server on port 5000.

3. **Set up the Frontend**
   - Navigate to the `frontend/` directory.
   - Run `npm install`.
   - Ensure the `.env` file points to `http://localhost:5000`.
   - Run `npm run dev` to start the Vite development server.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, Mongoose, Google Gen AI SDK
- **Database**: MongoDB
- **Security**: Express-Rate-Limit, Helmet, Zod, Bcrypt, JWT

## 📝 License
This project is submitted for evaluation and is open for review.
