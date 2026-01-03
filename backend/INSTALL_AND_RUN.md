# Quick Installation & Run Guide

## 🔧 Fix the "ModuleNotFoundError" Issue

You need to **install the dependencies** first. Here's how:

### Step 1: Make sure virtual environment is activated

You should see `(venv)` in your terminal prompt. If not:

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows)
venv\Scripts\activate
```

### Step 2: Install all dependencies

```bash
# Make sure you're in the backend directory with (venv) active
pip install -r requirements.txt
```

**This will take 5-10 minutes** (downloads ML models and packages).

### Step 3: Verify installation

```bash
python -c "import uvicorn; print('Uvicorn installed!')"
```

### Step 4: Run the server

```bash
python run.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ⚠️ Common Issues

### Issue: "pip is not recognized"
**Solution**: Make sure Python is installed and in PATH, or use:
```bash
python -m pip install -r requirements.txt
```

### Issue: Installation fails for some packages
**Solution**: Try upgrading pip first:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: "venv\Scripts\activate" doesn't work
**Solution**: You're already in the venv (see `(venv)` in prompt). Just run:
```bash
pip install -r requirements.txt
```

## 🚀 Quick Command Sequence

```bash
# 1. Navigate to backend
cd backend

# 2. Activate venv (if not already active)
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run server
python run.py
```


