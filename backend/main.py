"""
main.py — FastAPI backend for Smart Grid Intrusion Detection System
Run with: uvicorn main:app --reload
Docs at:  http://localhost:8000/docs
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import shap
import io
import os,subprocess

# ── Auto-train model on Railway first boot ─────────
if not os.path.exists("rf_model.pkl"):
    print("Training model for first time...")
    subprocess.run(["python", "model.py"], check=True)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Grid IDS API",
    description="Intrusion Detection using Random Forest + SHAP explainability",
    version="1.0.0"
)

# ── CORS — allow React dev server ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model once at startup ────────────────────────────────────────────────
MODEL_PATH = "rf_model.pkl"
FEATURES_PATH = "feature_names.pkl"

if not os.path.exists(MODEL_PATH):
    raise RuntimeError("rf_model.pkl not found. Run: python model.py first!")

print("Loading model...")
model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURES_PATH)
explainer = shap.TreeExplainer(model)
print(f"Model loaded. Features: {len(feature_names)}")


# ── Helper: get SHAP values safely (handles old/new SHAP formats) ────────────
def get_shap_attack_values(shap_vals, index=0):
    if isinstance(shap_vals, list):
        return shap_vals[1][index]           # old format: list[class][sample]
    else:
        return shap_vals[index, :, 1]        # new format: [sample, feature, class]


def get_expected_value():
    ev = explainer.expected_value
    if isinstance(ev, (list, np.ndarray)):
        return float(ev[1])
    return float(ev)


# ── Pydantic models ───────────────────────────────────────────────────────────
class SingleRow(BaseModel):
    features: dict

class PredictionResult(BaseModel):
    prediction: int
    label: str
    attack_probability: float
    top_features: list


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 1 — Health check
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/")
def root():
    return {
        "status": "IDS API running",
        "model": "Random Forest (NSL-KDD)",
        "features": len(feature_names),
        "endpoints": ["/predict/csv", "/predict/explain", "/features"]
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 2 — List all feature names (useful for frontend form)
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/features")
def get_features():
    return {"features": feature_names, "count": len(feature_names)}


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 3 — Batch prediction from CSV upload
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/predict/csv")
async def predict_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file with network traffic features.
    Returns predictions and attack probability for each row.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    # Keep only model feature columns that exist in upload
    missing = [f for f in feature_names if f not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing[:5]}... Make sure CSV has 41 NSL-KDD features."
        )

    df = df[feature_names].fillna(0)
    preds = model.predict(df)
    probs = model.predict_proba(df)[:, 1]

    rows = []
    for i, (pred, prob) in enumerate(zip(preds, probs)):
        rows.append({
            "row": i + 1,
            "prediction": int(pred),
            "label": "ATTACK" if pred == 1 else "NORMAL",
            "attack_probability": round(float(prob), 4)
        })

    return {
        "total_rows": len(preds),
        "attacks_detected": int(preds.sum()),
        "normal_traffic": int((preds == 0).sum()),
        "attack_rate_percent": round(float(preds.mean() * 100), 2),
        "predictions": rows
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 4 — Single row prediction + SHAP explanation
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/predict/explain", response_model=PredictionResult)
def predict_explain(row: SingleRow):
    """
    Send a single row of features as JSON.
    Returns prediction + top 10 SHAP features explaining WHY.
    """
    # Fill missing features with 0
    full_features = {f: row.features.get(f, 0) for f in feature_names}
    df = pd.DataFrame([full_features])[feature_names]

    pred = int(model.predict(df)[0])
    prob = float(model.predict_proba(df)[0, 1])

    # SHAP explanation
    shap_vals = explainer.shap_values(df)
    sv = get_shap_attack_values(shap_vals, index=0)

    # Top 10 features by absolute SHAP value
    top_features = sorted(
        zip(feature_names, sv.tolist()),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:10]

    return {
        "prediction": pred,
        "label": "ATTACK" if pred == 1 else "NORMAL",
        "attack_probability": round(prob, 4),
        "top_features": [
            {
                "feature": feat,
                "shap_value": round(val, 5),
                "direction": "attack" if val > 0 else "normal"
            }
            for feat, val in top_features
        ]
    }
