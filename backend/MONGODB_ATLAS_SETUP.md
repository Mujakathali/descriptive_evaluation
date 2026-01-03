# MongoDB Atlas Setup Guide

## ❓ Do You Need MongoDB Atlas?

**Short Answer**: **NO, it's optional!** The backend works perfectly without it.

**When you might want it**:
- ✅ To save evaluation history
- ✅ To retrieve past evaluations
- ✅ For analytics and reporting
- ✅ To keep audit trails

**Without MongoDB**:
- ✅ Evaluations still work
- ✅ Results are returned to frontend
- ✅ All features function normally
- ❌ Evaluations are not saved
- ❌ Can't retrieve past evaluations

## 🔗 How to Connect MongoDB Atlas (Optional)

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a free cluster (M0 - Free tier)

### Step 2: Create Database User

1. In MongoDB Atlas dashboard:
   - Go to **Database Access** → **Add New Database User**
   - Username: `your_username`
   - Password: `your_password` (save this!)
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**

### Step 3: Whitelist Your IP

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (for development)
   - Or add your specific IP: `0.0.0.0/0`
3. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Clusters** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Driver: **Python**, Version: **3.6 or later**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Update Connection String

Replace `<username>` and `<password>` with your database user credentials:

```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/deseva_db?retryWrites=true&w=majority
```

**Important**: Replace:
- `myuser` → Your database username
- `mypassword` → Your database password
- `deseva_db` → Your database name (you can choose any name)

### Step 6: Add to Backend .env File

Create or edit `backend/.env` file:

```env
# MongoDB Atlas Connection
DATABASE_URL=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/deseva_db?retryWrites=true&w=majority

# Other settings (optional)
OPENAI_API_KEY=your_openai_key_here
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Step 7: Restart Backend Server

```bash
# Stop the server (Ctrl+C)
# Then restart
python run.py
```

You should see in logs:
```
INFO: Connected to MongoDB successfully
```

## ✅ Verify Connection

### Check Backend Logs

When you start the server, look for:
- ✅ `INFO: Connected to MongoDB successfully` → Working!
- ⚠️ `WARNING: DATABASE_URL not set. Database features will be disabled.` → Not configured (but app still works)

### Test with an Evaluation

1. Submit an evaluation from frontend
2. Check MongoDB Atlas dashboard:
   - Go to **Collections**
   - You should see `evaluations` collection
   - Documents should appear after each evaluation

## 🔒 Security Notes

1. **Never commit `.env` file** to git (it's in .gitignore)
2. **Use strong passwords** for database user
3. **Restrict IP access** in production (don't use 0.0.0.0/0)
4. **Rotate passwords** regularly

## 🎯 Example Connection String Format

```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/database_name?retryWrites=true&w=majority
```

**Breakdown**:
- `username` - Your MongoDB Atlas database user
- `password` - Your MongoDB Atlas database password
- `cluster0.abc123.mongodb.net` - Your cluster address
- `database_name` - Name of your database (can be anything)
- `?retryWrites=true&w=majority` - Connection options

## 🚨 Troubleshooting

### Error: "Authentication failed"
- Check username and password are correct
- Make sure you replaced `<username>` and `<password>` in connection string

### Error: "IP not whitelisted"
- Go to Network Access in Atlas
- Add your IP address or use 0.0.0.0/0 for development

### Error: "Connection timeout"
- Check internet connection
- Verify cluster is running in Atlas dashboard
- Check firewall settings

### Still not working?
- The app works fine without MongoDB
- You can skip it for now and add it later
- Check backend logs for specific error messages

## 📝 Quick Checklist

- [ ] MongoDB Atlas account created
- [ ] Free cluster created
- [ ] Database user created (username + password)
- [ ] IP address whitelisted
- [ ] Connection string copied and updated
- [ ] `.env` file created with `DATABASE_URL`
- [ ] Backend restarted
- [ ] See "Connected to MongoDB successfully" in logs

## 💡 Pro Tip

You can test the connection without running the full app:

```python
# test_mongo.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient("your_connection_string_here")
    await client.admin.command('ping')
    print("✅ Connected successfully!")
    client.close()

asyncio.run(test())
```


