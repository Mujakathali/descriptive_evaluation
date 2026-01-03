# MongoDB Atlas Usage in the Backend

## 📍 Where MongoDB is Used

### 1. **Automatic Storage** (Every Evaluation)
**File**: `backend/app/api/evaluate.py` (Line 140)
**Function**: `save_evaluation()`

Every time a student answer is evaluated, the complete result is **automatically saved** to MongoDB:

```python
await save_evaluation(evaluation_record)
```

**What Gets Saved:**
```json
{
  "question": "Explain photosynthesis.",
  "teacher_answer": "Photosynthesis is the process...",
  "student_answer": "Plants prepare food using sunlight.",
  "max_marks": 10.0,
  "final_marks": 7.5,
  "semantic_similarity": 82.0,
  "concept_coverage": 65.0,
  "covered_concepts": ["sunlight", "food preparation"],
  "missing_concepts": ["chlorophyll"],
  "feedback": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "suggestions": ["..."]
  },
  "concept_analysis": [
    {
      "concept": "sunlight",
      "status": "covered",
      "coverage": 100.0
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. **Retrieve Evaluation History**
**File**: `backend/app/api/evaluate.py` (Line 241)
**Endpoint**: `GET /evaluations`

Allows you to retrieve past evaluations:
- List recent evaluations
- Pagination support (limit/skip)
- Sorted by timestamp (newest first)

**Usage Example:**
```bash
GET /evaluations?limit=10&skip=0
```

### 3. **Get Specific Evaluation**
**File**: `backend/app/api/evaluate.py` (Line 267)
**Endpoint**: `GET /evaluations/{evaluation_id}`

Retrieve a specific evaluation by its ID.

**Usage Example:**
```bash
GET /evaluations/507f1f77bcf86cd799439011
```

## 🗄️ Database Structure

**Collection Name**: `evaluations`

**Document Structure**:
```
evaluations/
├── _id (ObjectId) - Auto-generated
├── question (string)
├── teacher_answer (string)
├── student_answer (string)
├── max_marks (float)
├── final_marks (float)
├── semantic_similarity (float)
├── concept_coverage (float)
├── covered_concepts (array)
├── missing_concepts (array)
├── feedback (object)
│   ├── strengths (array)
│   ├── weaknesses (array)
│   └── suggestions (array)
├── concept_analysis (array)
│   └── {concept, status, coverage}
└── timestamp (datetime)
```

## ⚙️ How It Works

### Connection Flow:
1. **Startup**: `app/main.py` calls `connect_to_mongo()`
2. **Connection**: Connects to MongoDB Atlas using `DATABASE_URL`
3. **Storage**: Each evaluation automatically saved via `save_evaluation()`
4. **Retrieval**: Optional endpoints to fetch past evaluations

### Code Flow:
```
User submits evaluation
    ↓
POST /evaluate endpoint
    ↓
Evaluation processed (NLP, scoring, feedback)
    ↓
Result returned to frontend
    ↓
[OPTIONAL] save_evaluation() → MongoDB Atlas
```

## 🔧 Configuration

**Location**: `backend/app/database/db.py`

**Connection String Format**:
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**Environment Variable**:
```env
DATABASE_URL=mongodb+srv://...
```

## ✅ Important Notes

1. **MongoDB is OPTIONAL**:
   - If `DATABASE_URL` is not set, the app works fine
   - Evaluations just won't be saved
   - You'll see warnings in logs: "Database not connected. Skipping save."

2. **Non-Blocking**:
   - Database saves happen asynchronously
   - Don't block the API response
   - Errors in saving don't affect the evaluation result

3. **Error Handling**:
   - If MongoDB is unavailable, evaluation still works
   - Errors are logged but don't crash the app
   - Frontend still receives the evaluation result

## 🎯 Use Cases for MongoDB

1. **Analytics**: Track evaluation patterns over time
2. **History**: View past evaluations
3. **Audit Trail**: Keep records of all evaluations
4. **Reporting**: Generate reports on student performance
5. **Research**: Analyze evaluation data for improvements

## 🚫 Without MongoDB

If you don't configure MongoDB:
- ✅ Evaluations still work perfectly
- ✅ Results are returned to frontend
- ✅ All features function normally
- ❌ Evaluations are not saved
- ❌ Can't retrieve past evaluations
- ❌ No evaluation history

## 📊 Example Queries (If You Want to Query Directly)

```javascript
// Get all evaluations
db.evaluations.find()

// Get evaluations with high scores
db.evaluations.find({final_marks: {$gte: 8}})

// Get recent evaluations
db.evaluations.find().sort({timestamp: -1}).limit(10)

// Count total evaluations
db.evaluations.countDocuments()
```


