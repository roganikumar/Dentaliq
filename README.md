# DentalIQ — AI-Powered Dental Clinic OS

A full-stack patient management system with AI chat assistant, built with React + Express + PostgreSQL + Python FastAPI.

##  Live Deployment

> Note: Replace these placeholder URLs with your actual deployment URLs after deploying.

| Service | URL |
|---------|-----|
 Frontend - `https://dentaliq.vercel.app` 
 Backend API | `https://dentaliq-api.railway.app`
 AI Service | `https://dentaliq-ai.railway.app` 
 Database | Neon PostgreSQL 



### Demo Credentials
```
Email:    admin@dentaliq.com
Password: password123
```

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [Project Structure](#project-structure)
- [Security](#security)

---

## ✨ Features

### Patient Management
- ✅ Full CRUD operations (Create, Read, Update, Delete/Archive)
- ✅ Paginated patient list with server-side search
- ✅ Fuzzy name search using PostgreSQL trigram indexes
- ✅ Filter by status (active, inactive, archived)
- ✅ Detailed patient profiles with medical notes

### AI Chat Assistant
- ✅ Patient-specific chat history
- ✅ Context-aware AI responses powered by Claude Sonnet 4
- ✅ Real-time typing indicators
- ✅ Persistent message history
- ✅ Graceful fallback to mock responses when API unavailable
- ✅ Rate limiting to prevent cost overruns

### Authentication & Security
- ✅ JWT-based stateless authentication
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Protected routes with role-based access control (RBAC)
- ✅ HTTP security headers via Helmet
- ✅ CORS with origin allowlisting
- ✅ Rate limiting (global + per-route)
- ✅ Input validation on all endpoints

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                        │
│              React 18 SPA (Vite + React Router)             │
│         Patients Dashboard · AI Chat · Auth Forms           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS REST + JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NODE.JS / EXPRESS API                      │
│   JWT Auth · Rate Limiting · Validation · Error Handling    │
│      Routes: /auth  /patients  /chat                        │
└─────────┬──────────────────────────────────┬────────────────┘
          │                                   │
          │ SQL Queries                       │ HTTP POST
          ▼                                   ▼
┌──────────────────────┐          ┌─────────────────────────┐
│   POSTGRESQL 15      │          │  PYTHON AI SERVICE      │
│                      │          │  FastAPI + httpx        │
│ • users              │          │  Prompt Engineering     │
│ • patients           │          │  Context Builder        │
│ • chat_messages      │          └───────────┬─────────────┘
│ • refresh_tokens     │                      │
│                      │                      │ HTTPS
└──────────────────────┘                      ▼
                                    ┌─────────────────────────┐
                                    │  ANTHROPIC CLAUDE API   │
                                    │  claude-sonnet-4        │
                                    └─────────────────────────┘
```

### Design Principles

1. Separation of Concerns -  Clean layer architecture with dedicated services
2. Stateless API - JWT tokens enable horizontal scaling without shared session state
3. AI Isolation - Python microservice wraps Claude API, keeping secrets server-side
4. Security by Default - All routes protected, all inputs validated, all errors sanitized
5. Database-First - PostgreSQL with proper indexes and constraints

---

## Tech Stack

### Frontend
- React 18, Vite, React Router 6, React Hook Form, Axios, date-fns

### Backend
- Node.js 20, Express 4, PostgreSQL 15, bcryptjs, jsonwebtoken, helmet

### AI Service
- Python 3.11, FastAPI, httpx, Pydantic, Anthropic SDK

### Infrastructure
- Docker + Docker Compose, Vercel, Railway, Neon

---

## Setup & Installation

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org))
- Python 3.11+ ([download](https://python.org))
- PostgreSQL 15+ (local or [Neon](https://neon.tech))
- Docker Desktop (optional)

---

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone or unzip the project
cd dentaliq

# 2. Copy environment files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env

# 3. (Optional) Add your Anthropic API key
# Edit ai-service/.env:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# (Leave blank for mock mode)

# 4. Start all services
docker-compose up --build

# Services available at:
# Frontend:    http://localhost:5173
# Backend API: http://localhost:3001
# AI Service:  http://localhost:8000
```

The database auto-migrates and seeds demo data on first start.

---

### Option 2: Manual Setup

#### 1. Database Setup

Option A: Local PostgreSQL
```bash
createdb dentaliq
```

Option B: Neon (Free Serverless)
Sign up at [neon.tech](https://neon.tech) and copy your connection string.

#### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dentaliq
JWT_SECRET=your-super-secret-key-min-32-characters-long
AI_SERVICE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173
```

Run migrations and seed:
```bash
node src/config/migrate.js
node src/config/seed.js
npm run dev  # → http://localhost:3001
```

#### 3. AI Service

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Optionally add ANTHROPIC_API_KEY

uvicorn main:app --reload --port 8000
```

#### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:3001 (already set)

npm run dev  # → http://localhost:5173
```

Login with `admin@dentaliq.com` / `password123`

---

##  Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
 `DATABASE_URL` | PostgreSQL connection string | Yes |
 `JWT_SECRET` | Secret key for JWT (min 32 chars) | Yes |
 `AI_SERVICE_URL` | Python AI service URL | Yes |
 `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | Yes |
 `PORT` | Server port | No (default: 3001) |
 `NODE_ENV` | `development` / `production` | No |
 `JWT_EXPIRES_IN` | JWT token expiration | No (default: 7d) |

### AI Service (`ai-service/.env`)

| Variable |
|----------|
 `ANTHROPIC_API_KEY` - Any API key 
 `AI_MODEL` -  model 
 `AI_MAX_TOKENS` - Max tokens per response (default: 800) 

*If not provided, runs in mock mode with placeholder responses.

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

---

##  API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

All protected endpoints require `Authorization: Bearer <token>` header.

### Authentication

#### POST /auth/register
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@clinic.com",
  "password": "securepass123"
}

→ 201 { user: {...}, accessToken: "..." }
```

#### POST /auth/login
```json
{
  "email": "admin@dentaliq.com",
  "password": "password123"
}

→ 200 { user: {...}, accessToken: "..." }
```

#### GET /auth/me
```
→ 200 { id, name, email, role, created_at }
```

### Patients

#### GET /patients?page=1&limit=10&search=&status=
```
→ 200 { data: [...], pagination: {...} }
```

#### GET /patients/:id
```
→ 200 { patient object }
```

#### POST /patients
```json
{
  "name": "Rajesh Gupta",
  "email": "rajesh@example.com",
  "phone": "+91 99887 76655",
  "dob": "1985-03-20",
  "medical_notes": "No allergies"
}

→ 201 { patient object }
```

#### PATCH /patients/:id
```json
{
  "phone": "+91 98765 00000",
  "status": "inactive"
}

→ 200 { updated patient }
```

#### DELETE /patients/:id
```
→ 200 { id, archived: true }
```

### Chat

#### GET /chat/:patientId
```
→ 200 { messages: [{id, role, content, created_at}, ...] }
```

#### POST /chat
```json
{
  "patientId": "uuid",
  "message": "How often should I floss?"
}

→ 201 { userMessage: {...}, aiMessage: {...} }
```

### Error Format
```json
{
  "error": "Human-readable message"
}
```

Status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limit), 500 (server error)

---

##  Deployment Guide

### Frontend → Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Set Root Directory: `frontend`
4. Add env var: `VITE_API_URL=https://your-backend.railway.app`
5. Deploy

### Backend + AI → Railway

1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL database service
3. Create service from `/backend` directory
   - Set env vars from `.env.example`
   - Railway auto-provides `DATABASE_URL`
   - Set `NODE_ENV=production`
4. Create service from `/ai-service` directory
5. After deploy, run migrations via Railway shell:
   ```bash
   node src/config/migrate.js
   node src/config/seed.js
   ```

---

##  AI Usage Disclosure

### AI-Powered Features (Production)

Chat Assistant — All chat responses API key we use (Anthropic API)
- System prompt engineering for helpful, professional responses
- Context injection with patient data
- 10-turn conversation history
- Mock mode when API key unavailable

### AI Development Assistance

#### Fully AI-Generated

- Python AI Service — FastAPI app, prompt builder, Anthropic client
- Docker Setup — Multi-service compose with health checks
- Documentation — README, API docs, deployment guides, design document

#### Human-Guided with AI
- Architecture — Overall structure discussed and implemented with AI
- Security — Best practices applied (bcrypt, JWT, rate limiting)
- API Design — RESTful patterns, pagination, error handling

#### Human-Written
- Requirements Analysis — Dental clinic workflow understanding
- Testing Strategy — Manual testing procedures
- Deployment Decisions — Platform selection (Vercel/Railway/Neon)


### Quality Assurance

Despite AI assistance:
- ✅ Manually reviewed for correctness
- ✅ Tested end-to-end
- ✅ Proper separation of concerns
- ✅ Security and scaling best practices
- ✅ Production-grade error handling

---

## 📁 Project Structure

```
dentaliq/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── config/         # DB pool, migrations, seed
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React 18 SPA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # useAuth
│   │   ├── services/       # Axios client
│   │   ├── App.jsx         # Router
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── ai-service/             # Python FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   └── DentalIQ_Design_Doc.docx
│
├── docker-compose.yml
└── README.md
```

---

## Security

### Implemented
- JWT with 7-day expiration
- bcrypt (12 rounds)
- Parameterized SQL queries
- React auto-escaping (XSS prevention)
- Rate limiting (200/15min global, 20/min chat)
- CORS allowlisting
- Helmet.js headers
- Input validation on all routes
- Error sanitization (no stack traces in prod)

### HIPAA-Aware Design
- ✅ Soft deletes for audit trail
- ✅ PHI minimization in AI prompts
- ✅ Encryption in transit + at rest
- ✅ Structured logging (no PHI)

Production Checklist:
- [ ] Audit logs table
- [ ] BAA with Anthropic
- [ ] MFA
- [ ] Session timeout
- [ ] Penetration testing

---

