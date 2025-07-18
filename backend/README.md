# IRAS-DDH Backend API

FastAPI backend for the Indian Railway Announcement System for DHH.

## Features

- User authentication with JWT tokens
- Role-based access control (Admin/Operator)
- SQLite database with SQLAlchemy ORM
- Automatic default user creation
- CORS enabled for frontend integration

## Default Users

The system automatically creates these default users on startup:

### Admin User
- **Email**: admin@indianrail.gov.in
- **Password**: admin123
- **Role**: admin

### Operator User
- **Email**: operator@indianrail.gov.in
- **Password**: operator123
- **Role**: operator

## Setup Instructions

### 1. Create Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt
```

### 3. Start the Server

```bash
# Option 1: Using the run script
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `GET /auth/users` - Get all users (admin only)
- `POST /auth/register` - Register new user (admin only)

### Health Check
- `GET /` - API status and version

## API Documentation

Once the server is running, you can access:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## Database

- **Type**: SQLite3
- **Location**: `backend/database/iras_ddh.db`
- **Auto-creation**: Tables are created automatically on first run

## Environment Variables

For production, consider setting these environment variables:
- `SECRET_KEY` - JWT secret key
- `DATABASE_URL` - Database connection string 