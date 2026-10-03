"""
train_motor_ai.py - Machine Learning Experimentation & Model Training Pipeline
CWRU 2 HP Motor Bearing Anomaly Detection & Fault Classification
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    confusion_matrix, classification_report
)

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

# 1. SETUP PATHS & CANONICAL FEATURE ORDER
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

FEATURE_COLUMNS = ["rms", "sd", "kurtosis", "crest", "max", "min", "skewness"]
TARGET_COLUMN = "fault"
RANDOM_SEED = 42

data_candidates = [
    os.path.join(project_root, "ml", "data", "feature_time_48k_2048_load_1.csv"),
    os.path.join(script_dir, "feature_time_48k_2048_load_1.csv"),
    os.path.join(project_root, "feature_time_48k_2048_load_1.csv")
]
data_path = next((p for p in data_candidates if os.path.exists(p)), data_candidates[0])

models_dir = os.path.join(project_root, "backend", "models")
plots_dir = os.path.join(project_root, "ml", "plots")
os.makedirs(models_dir, exist_ok=True)
os.makedirs(plots_dir, exist_ok=True)

def run_ml_pipeline():
    print("==================================================")
    print(" STAGE 2: MOTOR AI MODEL TRAINING & VALIDATION PIPELINE")
    print("==================================================")
    
    # 2. DATA LOADING & STRICT VALIDATION
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file not found at: {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"[OK] Loaded dataset from: {os.path.basename(data_path)}")
    print(f"    Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")

    # Data Validation Checks
    print("\n--- DATA VALIDATION AUDIT ---")
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"CRITICAL: Missing required columns in dataset: {missing_cols}")
    print(f"[OK] All 7 canonical feature columns present: {FEATURE_COLUMNS}")
    print(f"[OK] Target column present: '{TARGET_COLUMN}'")

    missing_cells = df[FEATURE_COLUMNS + [TARGET_COLUMN]].isnull().sum().sum()
    print(f"[OK] Missing (null) values in dataset: {missing_cells}")

    nan_count = np.isnan(df[FEATURE_COLUMNS].values).sum()
    inf_count = np.isinf(df[FEATURE_COLUMNS].values).sum()
    print(f"[OK] NaN values: {nan_count}, Inf values: {inf_count}")

    dups = df.duplicated(subset=FEATURE_COLUMNS).sum()
    print(f"[OK] Duplicate feature rows: {dups}")

    # Class distribution
    print("\n--- CLASS DISTRIBUTION (10 CWRU Bearing Classes) ---")
    class_counts = df[TARGET_COLUMN].value_counts()
    for cls_name, count in class_counts.items():
        pct = (count / len(df)) * 100
        print(f"  - {cls_name:12s} : {count:4d} samples ({pct:5.2f}%)")

    # Feature statistics
    print("\n--- CANONICAL FEATURE RANGES (Descriptive Statistics) ---")
    stats = df[FEATURE_COLUMNS].describe().T[['mean', 'std', 'min', '50%', 'max']]
    print(stats.to_string())

    # 3. FEATURE EXTRACTION & LABEL ENCODING
    X = df[FEATURE_COLUMNS].copy()
    y_raw = df[TARGET_COLUMN].copy()

    le = LabelEncoder()
    y_encoded = le.fit_transform(y_raw)
    class_names = list(le.classes_)

    # 4. STRATIFIED TRAIN/TEST SPLIT (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=RANDOM_SEED, stratify=y_encoded
    )
    print(f"\n[OK] Train/Test Split (80/20 Stratified, seed={RANDOM_SEED}):")
    print(f"    Train set: {X_train.shape[0]} samples")
    print(f"    Test set : {X_test.shape[0]} samples")

    # 5. FEATURE SCALING
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 6. MODEL COMPARISON & TRAINING
    candidate_models = {}

    candidate_models['Random Forest'] = RandomForestClassifier(
        n_estimators=100, max_depth=10, random_state=RANDOM_SEED
    )
    candidate_models['Support Vector Machine (SVM)'] = SVC(
        kernel='rbf', C=1.0, probability=True, random_state=RANDOM_SEED
    )
    candidate_models['Lightweight Neural Net (MLP)'] = MLPClassifier(
        hidden_layer_sizes=(32, 16), max_iter=500, random_state=RANDOM_SEED
    )

    if HAS_XGBOOST:
        candidate_models['XGBoost Classifier'] = xgb.XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.1, random_state=RANDOM_SEED
        )

    results = []

    print("\n==================================================")
    print(" MODEL EVALUATION & MULTI-CLASS PERFORMANCE")
    print("==================================================")

    for name, model in candidate_models.items():
        print(f"\n[*] Training {name}...")
        t0 = time.time()
        model.fit(X_train_scaled, y_train)
        t_train_ms = (time.time() - t0) * 1000

        t0 = time.time()
        y_pred = model.predict(X_test_scaled)
        t_infer_ms = ((time.time() - t0) / len(X_test)) * 1000

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)

        results.append({
            'Model': name,
            'Accuracy': acc,
            'Precision (Macro)': prec,
            'Recall (Macro)': rec,
            'F1-Score (Macro)': f1,
            'Train Time (ms)': t_train_ms,
            'Infer Time (ms/sample)': t_infer_ms,
            'object': model,
            'y_pred': y_pred
        })

        print(f"    Accuracy  : {acc * 100:.2f}%")
        print(f"    Macro F1  : {f1 * 100:.2f}%")
        print(f"    Macro Prec: {prec * 100:.2f}%")
        print(f"    Macro Rec : {rec * 100:.2f}%")

    res_df = pd.DataFrame(results)
    print("\n==================================================")
    print(" MODEL COMPARISON SUMMARY")
    print("==================================================")
    disp_cols = ['Model', 'Accuracy', 'Precision (Macro)', 'Recall (Macro)', 'F1-Score (Macro)', 'Infer Time (ms/sample)']
    print(res_df[disp_cols].to_string(index=False))

    # Select best model based on macro F1-Score & Accuracy
    best_row = res_df.sort_values(by=['F1-Score (Macro)', 'Accuracy'], ascending=[False, False]).iloc[0]
    best_name = best_row['Model']
    best_model = best_row['object']
    best_y_pred = best_row['y_pred']

    print(f"\n[SELECTED BEST MODEL] {best_name}")
    print(f"    Accuracy: {best_row['Accuracy'] * 100:.2f}%")
    print(f"    F1-Score: {best_row['F1-Score (Macro)'] * 100:.2f}%")

    # Save Confusion Matrix Plot
    cm = confusion_matrix(y_test, best_y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.title(f'Confusion Matrix - {best_name} (Test Set)', fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Fault Class', fontsize=10)
    plt.ylabel('True Fault Class', fontsize=10)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    cm_path = os.path.join(plots_dir, 'confusion_matrix.png')
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[OK] Saved confusion matrix visualization to: {cm_path}")

    # Generate classification report
    report_dict = classification_report(y_test, best_y_pred, target_names=class_names, output_dict=True, zero_division=0)

    # 7. SERIALIZATION & METADATA EXPORT
    model_save_path = os.path.join(models_dir, "motor_best_model.joblib")
    scaler_save_path = os.path.join(models_dir, "motor_scaler.joblib")
    metadata_save_path = os.path.join(models_dir, "model_metadata.json")

    joblib.dump(best_model, model_save_path)
    joblib.dump(scaler, scaler_save_path)

    model_bytes = os.path.getsize(model_save_path)

    metadata = {
        "dataset_filename": os.path.basename(data_path),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "random_seed": RANDOM_SEED,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "class_names": class_names,
        "best_model": best_name,
        "model_version": "v2.0-cwru-standardized",
        "training_timestamp": datetime.now().isoformat(),
        "accuracy": float(best_row['Accuracy']),
        "precision_macro": float(best_row['Precision (Macro)']),
        "recall_macro": float(best_row['Recall (Macro)']),
        "f1_score_macro": float(best_row['F1-Score (Macro)']),
        "training_time_ms": float(best_row['Train Time (ms)']),
        "inference_time_ms_per_sample": float(best_row['Infer Time (ms/sample)']),
        "model_size_bytes": model_bytes,
        "model_size_kb": round(model_bytes / 1024, 2),
        "per_class_metrics": {
            cls: {
                "precision": float(report_dict[cls]["precision"]),
                "recall": float(report_dict[cls]["recall"]),
                "f1_score": float(report_dict[cls]["f1-score"]),
                "support": int(report_dict[cls]["support"])
            } for cls in class_names if cls in report_dict
        },
        "confusion_matrix": cm.tolist(),
        "saved_model_file": "backend/models/motor_best_model.joblib",
        "saved_scaler_file": "backend/models/motor_scaler.joblib"
    }

    with open(metadata_save_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[OK] Saved best model to: {model_save_path} ({metadata['model_size_kb']} KB)")
    print(f"[OK] Saved scaler to    : {scaler_save_path}")
    print(f"[OK] Saved metadata to  : {metadata_save_path}")
    print("==================================================\n")

if __name__ == '__main__':
    run_ml_pipeline()
