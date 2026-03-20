# Smart Grid Intrusion Detection System
### Random Forest + SHAP + React + FastAPI

---

## Project Structure

```
intrusion-detector/
├── backend/
│   ├── main.py             ← FastAPI server
│   ├── model.py            ← Train & save model (run once)
│   ├── requirements.txt    ← Python dependencies
│   ├── rf_model.pkl        ← Generated after running model.py
│   └── feature_names.pkl   ← Generated after running model.py
│
└── frontend/
    ├── src/
    │   ├── App.jsx         ← Main React UI
    │   ├── api.js          ← All API calls
    │   ├── main.jsx        ← React entry point
    │   └── index.css       ← Global styles
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Setup & Run

### Step 1 — Backend setup

```bash
cd backend
pip install -r requirements.txt
python model.py          # trains model, saves rf_model.pkl (takes ~60s)
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

### Step 2 — Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | /                 | Health check                             |
| GET    | /features         | List all 41 feature names                |
| POST   | /predict/csv      | Batch predict from CSV file upload       |
| POST   | /predict/explain  | Single row prediction + SHAP explanation |

---

## Test the API manually

Open http://localhost:8000/docs and try:

**POST /predict/explain** with body:
```json
{
  "features": {
    "src_bytes": 50000,
    "dst_bytes": 0,
    "duration": 0,
    "logged_in": 0
  }
}
```
Should return: ATTACK with high probability

---

## What the app does

1. User opens React app at localhost:5173
2. They enter network traffic features (or upload a CSV)
3. React sends data to FastAPI via HTTP POST
4. FastAPI runs the Random Forest model
5. SHAP explains which features caused the prediction
6. Results shown: NORMAL or ATTACK + probability + feature importance bars

---

## FYP Connection

This app directly implements findings from:
"Smart Grid Cybersecurity: Threats and Mitigation — A Systematic Literature Review"

- RQ2 gap addressed: ML model with explainability (SHAP) for operator trust
- Top features (src_bytes, dst_bytes, flag) match SCADA DoS/FDI attack patterns
- F1-score: 0.9990 on NSL-KDD test set
