# IRAS-DDH (Indian Railway Announcement System for DHH)

A comprehensive system for managing train announcements specifically designed for Deaf and Hard of Hearing (DHH) passengers.

## 🏗️ Project Structure

```
iras-ddh/
├── frontend/          # Next.js React application
│   ├── src/          # Source code
│   ├── package.json  # Frontend dependencies
│   └── README.md     # Frontend documentation
├── backend/          # FastAPI Python backend
│   ├── app/          # Backend source code
│   ├── requirements.txt
│   └── README.md     # Backend documentation
└── README.md         # This file
```

## 🚀 Quick Start

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: http://localhost:9002

### Backend (FastAPI)
```bash
cd backend
./start.sh
```
Backend will be available at: http://localhost:8000

## 🔑 Default Users

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@indianrail.gov.in | admin123 |
| **Operator** | operator@indianrail.gov.in | operator123 |

## 📚 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Project Blueprint](./frontend/docs/blueprint.md)

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **AI Integration**: Genkit AI

### Backend
- **Framework**: FastAPI
- **Language**: Python
- **Database**: SQLite3 with SQLAlchemy
- **Authentication**: JWT tokens
- **Security**: bcrypt password hashing

## 🎯 Features

- **Role-Based Authentication**: Admin and Operator roles
- **Announcement Management**: Create, edit, and schedule announcements
- **Approval Workflow**: Admin approval system
- **Screen Management**: Platform/screen mapping
- **Real-time Monitoring**: Live announcement status
- **Feedback System**: User feedback and error reporting
- **Accessibility**: Designed for DHH users

## 🔧 Development

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- npm or yarn (for frontend)
- pip (for backend)

### Environment Setup
1. Clone the repository
2. Set up frontend: `cd frontend && npm install`
3. Set up backend: `cd backend && ./start.sh`
4. Start both services
5. Access the application at http://localhost:9002

## 📄 License

This project is part of the Indian Railway Announcement System for DHH. 