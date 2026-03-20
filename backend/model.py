"""
model.py — Run this ONCE to train and save the Random Forest model.
Usage: python model.py
Output: rf_model.pkl and feature_names.pkl
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score

# ── 1. Column names for NSL-KDD ──────────────────────────────────────────────
col_names = [
    "duration", "protocol_type", "service", "flag",
    "src_bytes", "dst_bytes", "land", "wrong_fragment",
    "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted",
    "num_root", "num_file_creations", "num_shells",
    "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate",
    "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate",
    "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
    "label", "difficulty"
]

# ── 2. Load dataset ───────────────────────────────────────────────────────────
print("Loading NSL-KDD dataset...")
url = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain+.txt"
df = pd.read_csv(url, names=col_names)
df = df.drop("difficulty", axis=1)
print(f"  Loaded {len(df)} rows, {df.shape[1]} columns")

# ── 3. Encode categorical columns ─────────────────────────────────────────────
le = LabelEncoder()
for col in ["protocol_type", "service", "flag"]:
    df[col] = le.fit_transform(df[col])

# ── 4. Binary label: normal=0, attack=1 ───────────────────────────────────────
df["label"] = df["label"].apply(lambda x: 0 if x == "normal" else 1)
print(f"  Normal: {(df['label']==0).sum()}, Attacks: {(df['label']==1).sum()}")

# ── 5. Features and target ────────────────────────────────────────────────────
X = df.drop("label", axis=1)
y = df["label"]

# ── 6. Train / test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── 7. Train model ────────────────────────────────────────────────────────────
print("Training Random Forest...")
rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)

# ── 8. Evaluate ───────────────────────────────────────────────────────────────
y_pred = rf.predict(X_test)
f1 = f1_score(y_test, y_pred, average="weighted")
print(f"\nEvaluation on test set:")
print(classification_report(y_test, y_pred, target_names=["Normal", "Attack"]))
print(f"Weighted F1-score: {f1:.4f}")

# ── 9. Save model and feature names ──────────────────────────────────────────
joblib.dump(rf, "rf_model.pkl")
joblib.dump(X.columns.tolist(), "feature_names.pkl")
print("\nSaved: rf_model.pkl and feature_names.pkl")
print("Done! Now run: uvicorn main:app --reload")
