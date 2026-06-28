# PrepAI — AI Powered Interview Preparation Platform

> Final Year B.Tech CSE Project | Full Stack + AI Integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| State Mgmt | Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| AI | OpenAI GPT-3.5 |
| Auth | JWT + bcrypt + Google OAuth |
| Storage | Cloudinary |
| Realtime | Socket.IO |
| Code Exec | Judge0 API |
| Email | Nodemailer |

## Modules

1. **Authentication** — Register, Login, Google OAuth, Email Verification, Forgot Password
2. **AI Interview Generator** — Role-based questions with AI evaluation
3. **Mock Interview Chatbot** — Real-time AI conversation with voice support
4. **Voice Interview** — Speech-to-text answers with AI feedback
5. **Resume Analysis** — ATS score, keyword analysis, AI suggestions
6. **Coding Arena** — Monaco Editor + Judge0 + AI code review
7. **Analytics** — Score trends, skill performance, charts
8. **Admin Dashboard** — User management, platform stats

## Setup

### 1. Clone & Install
```bash
cd "interview platform"
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Backend Environment
Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
JUDGE0_API_KEY=your_rapidapi_key
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers
```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Access
- **App**: http://localhost:5173
- **API**: http://localhost:5000/api/health

## API Keys Needed
- **OpenAI**: platform.openai.com → API Keys
- **MongoDB Atlas**: cloud.mongodb.com (free tier)
- **Cloudinary**: cloudinary.com (free tier, 25GB)
- **Judge0**: rapidapi.com/judge0-official/api/judge0-ce (500 req/day free)
- **Google OAuth**: console.cloud.google.com

## Folder Structure
```
interview platform/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/authMiddleware.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
└── frontend/
    └── src/
        ├── components/common/
        ├── pages/
        │   ├── auth/
        │   ├── dashboard/
        │   ├── interview/
        │   ├── resume/
        │   ├── coding/
        │   └── analytics/
        ├── redux/slices/
        └── services/api.js
```
