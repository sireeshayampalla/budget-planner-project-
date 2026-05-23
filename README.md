# Budget Planner | Full-Stack Budget Planner & Spending Behaviour Insights

A premium full-stack budget management web application powered by **React, TypeScript, Node.js, Express, and MongoDB**, featuring interactive dashboards, category aggregations, and rules-based spending insights.

## Project Structure

```
budget-planner/
│
├── backend/                  # Node.js + Express MVC REST API (TypeScript)
│   ├── src/
│   │   ├── config/           # DB connectors, type-safe envs, loggers
│   │   ├── controllers/      # Route logic handlers (auth, expense, income, insights)
│   │   ├── middleware/       # Auth guards, JSON field checkers, error loggers
│   │   ├── models/           # Mongoose schemas (User, Expense, Income, Insight)
│   │   ├── routes/           # API router endpoints
│   │   ├── services/         # Spending behavior core calculations service
│   │   └── utils/            # JWT generators, response helpers
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/                 # React + Vite application (TypeScript & Tailwind)
    ├── src/
    │   ├── api/              # Axios HTTP client with authentication interceptors
    │   ├── components/       # Card containers, select tags, layouts
    │   ├── store/            # Zustand session state store
    │   ├── routes/           # AppRoutes and private routing layouts
    │   ├── pages/            # Login, Registration, Dashboard, Expenses, Income, Insights
    │   ├── index.css         # Tailwind & scrollbar styles
    │   └── main.tsx          # Client entry point
    ├── tailwind.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com) (local community server running or a MongoDB Atlas connection string)

### 1. Database & Environment Configuration

Create a `.env` file in the **`backend`** directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/budgetplanner
JWT_SECRET=super_secret_jwt_key_123_change_me
NODE_ENV=development
```

### 2. Installation & Quick Start

Navigate to the project root directory. First, install the dependencies for both folders:

```bash
# In the backend directory
cd backend
npm install

# In the frontend directory
cd frontend
npm install
```

After installing dependencies, you can launch the development servers directly from the project root directory using:

```bash
npm run dev:backend      # Launches the Express server on http://localhost:5000
npm run dev:frontend     # Launches the Vite React server (e.g. on http://localhost:5175)
```

The React frontend automatically proxies all `/api` requests to the Express server running on port 5000.

### 3. Production Building

To compile and bundle both components for a production release, run:

```bash
npm run build:backend
npm run build:frontend
```

---

## Spending Behaviour Insights Engine

The app implements a rules-based financial evaluation model that dynamically computes a monthly **Spending Score (0-100)**:
- **Starting Score:** 100 points.
- **Overspending Penalty:** `-45 points` if total monthly expenditures exceed total income.
- **Savings Rate Penalty:**
  - Saves `< 10%`: `-20 points` (Warning trigger).
  - Saves `10% - 20%`: `-10 points` (Encouragement trigger).
  - Saves `> 20%`: `0 points` (Congratulations badge).
- **Concentration Risk:** `-15 points` if a single category represents more than 50% of the month's total expenses.

Additionally, the engine highlights the **highest spending category**, delivers **warnings** (overspending, missing logs), and provides **tailored savings tips** based on the highest category expenditure.
