# AI Group Project Accountability Tracker

A comprehensive system for tracking student contributions in group projects using AI-powered evaluations and GitHub integration.

## 🚀 Key Features

*   **Learning Group (LG) Management**: Automated team formation for groups of 3 students based on class section and LG number.
*   **Automatic Team Initialization**: 
    *   Randomly assigns a Team Leader.
    *   Automatically creates 5 subject workspaces (Prompt Engineering, NLP, Software Engineering, XAI, and Data Warehousing & Data Mining).
*   **Leader-Driven Setup**: Team leaders can initialize project titles and descriptions for subject workspaces to unlock them for the team.
*   **Interactive Dashboard**: Real-time status tracking for students, showing team membership, project progress, and current phases.
*   **AI Integration**: (In Progress) Phase-wise task division and evaluation of student submissions.

## 🛠️ Tech Stack

*   **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Framer Motion, Lucide Icons.
*   **Backend**: Python, FastAPI, SQLAlchemy ORM, PostgreSQL.
*   **Authentication**: Simple Email/Password system (restricted to `@aurora.edu.in` domains).

## 📥 Setup Instructions

### 1. Backend Setup
1.  Navigate to the `backend/` directory.
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    source venv/bin/activate  # Linux/macOS
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure the environment variables in the **root** `.env` file (see `.env.example`).
5.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload
    ```

### 2. Frontend Setup
1.  Navigate to the `frontend/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🔑 Environment Variables

Create a `.env` file in the **project root** with the following keys:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_tracker
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here
```

## 📂 Project Structure

```text
├── backend/            # FastAPI Project
│   ├── app/           # Core Logic & Database Models
│   ├── routers/       # API Route Handlers
│   └── venv/          # Python Virtual Environment
├── frontend/           # React + Vite Project
│   ├── src/           # Components, Pages, Stores
│   └── public/        # Static Assets
├── .env                # Global Environment Config
├── .env.example        # Template for Environment Config
└── README.md           # Project Documentation
```

---
Built by Vivek Goud Adula.