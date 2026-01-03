# Frontend-Backend Connection Guide

## ✅ Current Status

The backend is **ready** and **configured** to work with your frontend, but you need to:

1. **Set up the backend** (install dependencies, configure environment)
2. **Start both servers** (backend + frontend)
3. **Verify the connection**

## 🔌 Connection Details

### Frontend Configuration
- **API Base URL**: `http://localhost:8000` (default)
- **Frontend Port**: `3000` (React default)
- **Backend Port**: `8000` (FastAPI default)

### Backend CORS Configuration
The backend is already configured to accept requests from:
- `http://localhost:3000` (React default port)
- `http://localhost:5173` (Vite default port)

## 📋 Step-by-Step Connection

### Step 1: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Backend Environment

Create a `.env` file in the `backend` directory:

```env
# OpenAI API (Optional - for enhanced feedback)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Atlas (Optional - for saving evaluations)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Application Settings
DEBUG=True

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Note**: Both OpenAI and MongoDB are **optional**. The system will work without them (with fallback feedback and no database storage).

### Step 3: Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
cd backend
venv\Scripts\activate  # Windows

# Start the server
python run.py

# OR
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Start Frontend Server

Open a **new terminal** window:

```bash
# Navigate to frontend directory
cd deseva

# Install dependencies (if not already done)
npm install

# Start the React app
npm start
```

The frontend will open at `http://localhost:3000`

### Step 5: Verify Connection

1. **Check Backend Health**:
   - Visit: http://localhost:8000/health
   - Should return: `{"status":"healthy","version":"1.0.0","timestamp":"..."}`

2. **Check API Documentation**:
   - Visit: http://localhost:8000/docs
   - You should see Swagger UI with all endpoints

3. **Test from Frontend**:
   - Open http://localhost:3000
   - Navigate to the evaluation page
   - Try submitting an evaluation
   - Check browser console (F12) for any errors

## 🔍 Troubleshooting

### Backend Not Starting

**Issue**: `ModuleNotFoundError` or import errors
**Solution**: 
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check Python version (needs 3.10+)

**Issue**: Port 8000 already in use
**Solution**: 
- Change port in `run.py` or use: `uvicorn app.main:app --port 8001`
- Update frontend `.env` with `REACT_APP_API_URL=http://localhost:8001`

### Frontend Can't Connect to Backend

**Issue**: CORS errors in browser console
**Solution**:
- Verify backend CORS includes your frontend URL
- Check backend is running on port 8000
- Restart backend after changing CORS settings

**Issue**: Network error / Connection refused
**Solution**:
- Verify backend is running: `curl http://localhost:8000/health`
- Check firewall isn't blocking port 8000
- Verify frontend API URL in `deseva/src/services/api.js`

### Models Not Loading

**Issue**: Slow first request or model errors
**Solution**:
- First run downloads models (~2GB) - be patient
- Check internet connection
- Ensure sufficient RAM (models need ~2GB)

## ✅ Verification Checklist

- [ ] Backend dependencies installed
- [ ] Backend `.env` file created (even if empty)
- [ ] Backend server running on port 8000
- [ ] Backend health check works: http://localhost:8000/health
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend server running on port 3000
- [ ] No CORS errors in browser console
- [ ] Can submit evaluation from frontend
- [ ] Results page displays correctly

## 🚀 Quick Start Commands

**Terminal 1 (Backend)**:
```bash
cd backend
venv\Scripts\activate  # Windows
python run.py
```

**Terminal 2 (Frontend)**:
```bash
cd deseva
npm start
```

## 📝 Important Notes

1. **Both servers must be running** for the app to work
2. **Backend must start first** (to load ML models)
3. **First backend startup** may take 2-5 minutes (downloading models)
4. **OpenAI API is optional** - system works with fallback feedback
5. **MongoDB is optional** - evaluations won't be saved but app works

## 🎯 Expected Behavior

When everything is connected:
- Frontend loads at http://localhost:3000
- Backend API available at http://localhost:8000
- Evaluation submissions work
- Results display with scores and feedback
- No console errors

If you see any issues, check the browser console (F12) and backend logs for error messages.

