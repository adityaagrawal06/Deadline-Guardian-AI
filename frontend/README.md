# 🎨 Deadline Guardian Frontend

This is the frontend client for Deadline Guardian, built with React and Vite. It is designed to be extremely fast, responsive, and aesthetically stunning.

## 🚀 Key Features
- **Interactive Multi-Agent Timeline**: A beautiful, animated UI to visualize the Planner, Realist, Risk, and Coordinator agents discussing tasks.
- **Dynamic Re-planning Support**: Integrates directly with the backend orchestrator to request emergency schedules on the fly.
- **Glassmorphism Design**: High-fidelity UI using TailwindCSS and Framer Motion for micro-interactions and depth.
- **Authentication**: Supports traditional Email/Password login (with strict Zod validation) and Google OAuth.
- **File Uploads**: Drag-and-drop proof submission UI.

## 🛠️ Installation

```bash
cd frontend
npm install
```

## ⚙️ Configuration

Create a `.env` file in this directory based on the following:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🏃‍♂️ Running the Development Server

```bash
npm run dev
```

This will start the Vite dev server, typically on `http://localhost:5173`. Ensure your backend is running simultaneously on port 5000 for full API functionality.
