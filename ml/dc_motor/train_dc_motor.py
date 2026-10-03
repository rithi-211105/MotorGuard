import os
import sys
import glob
import json
import joblib
import pandas as pd
import numpy as np
import scipy.io as io
from pathlib import Path
import wave
import soundfile as sf
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
DATASET_DIR = os.path.join(BASE_DIR, "Multi-Sensor Condition-Monitoring Dataset of a Bru")
EXCEL_PATH = os.path.join(BASE_DIR, "MotorsData_rev.xlsx")
METADATA_PATH = os.path.join(DATASET_DIR, "metadata.csv")
MODEL_DIR = os.path.join(BASE_DIR, "backend", "models", "dc_motor")
os.makedirs(MODEL_DIR, exist_ok=True)

print("==================================================")
print("12 V DC MOTOR MODEL TRAINING & ABLATION PIPELINE")
print("==================================================")

# 1. LOAD METADATA
df_meta = pd.read_csv(METADATA_PATH)
print(f"Loaded metadata.csv: {len(df_meta)} rows")

# 2. DEFINE 4-CLASS HEALTH TARGET
# Mapping condition to 4 main health categories:
# 0: Normal Operation (normal_no_reversal, normal_with_reversal)
# 1: Loose Foundation (loose_foundation_no_reversal, loose_foundation_with_reversal)
# 2: Suboptimal Control - Speed Reg (suboptimal_control_no_reversal, suboptimal_control_with_reversal)
# 3: Suboptimal Control - Speed+Current Reg (suboptimal_control_rt_no_reversal, suboptimal_control_rt_with_reversal)

def map_health_label(cond_str):
    if 'loose_foundation' in cond_str:
        return 'Loose Foundation'
    elif 'suboptimal_control_rt' in cond_str:
        return 'Suboptimal Control (Speed+Current Reg)'
    elif 'suboptimal_control' in cond_str:
        return 'Suboptimal Control (Speed Reg)'
    elif 'normal' in cond_str:
        return 'Normal Operation'
    else:
        return 'Unknown'

df_meta['health_label'] = df_meta['condition'].astype(str).apply(map_health_label)
print("\nTarget Health Class Distribution (File-level):")
print(df_meta['health_label'].value_counts())

# Define experiment_id for grouping: condition + speed_percent
df_meta['experiment_id'] = df_meta['condition'].astype(str) + "_spd" + df_meta['speed_percent'].astype(str)
print(f"\nTotal Unique Experiments (Group Variable): {df_meta['experiment_id'].nunique()}")

# 3. FEATURE EXTRACTION PIPELINE FROM RAW FILES
# We extract features per recording session / experiment
features_list = []

# Group metadata by experiment_id to collect available raw recordings per experiment
grouped_exp = df_meta.groupby('experiment_id')

for exp_id, group in grouped_exp:
    cond = group['condition'].iloc[0]
    health = group['health_label'].iloc[0]
    reversal = group['reversal'].iloc[0]
    speed_pct = group['speed_percent'].iloc[0]
    
    # Initialize feature record
    feat_rec = {
        'experiment_id': exp_id,
        'condition': cond,
        'health_label': health,
        'reversal': reversal,
        'speed_percent': speed_pct
    }
    
    # A. Armature Current (.bin)
    curr_rows = group[group['sensor'] == 'current']
    if not curr_rows.empty:
        cpath = os.path.join(DATASET_DIR, curr_rows.iloc[0]['new_path'])
        if os.path.exists(cpath):
            with open(cpath, 'rb') as f:
                f.seek(164) # Skip 164-byte RG01 header
                bdata = f.read(1000000) # Read 1M samples for fast robust statistics
                arr_u8 = np.frombuffer(bdata, dtype=np.uint8).astype(np.float64)
                
                # Convert raw scope uint8 to float values
                feat_rec['curr_mean'] = np.mean(arr_u8)
                feat_rec['curr_rms'] = np.sqrt(np.mean(arr_u8**2))
                feat_rec['curr_std'] = np.std(arr_u8)
                feat_rec['curr_peak'] = np.max(arr_u8)
                feat_rec['curr_p2p'] = np.ptp(arr_u8)
                feat_rec['curr_crest_factor'] = feat_rec['curr_peak'] / (feat_rec['curr_rms'] + 1e-9)
                
                # FFT features (thyristor ripple signature)
                fft_vals = np.abs(np.fft.rfft(arr_u8 - feat_rec['curr_mean']))
                feat_rec['curr_fft_peak'] = np.max(fft_vals)
                feat_rec['curr_fft_mean'] = np.mean(fft_vals)

    # B. Vibrometer Waveform (.wav)
    wav_rows = group[group['sensor'] == 'sound_vibrometer']
    if not wav_rows.empty:
        wpath = os.path.join(DATASET_DIR, wav_rows.iloc[0]['new_path'])
        if os.path.exists(wpath):
            data, fs = sf.read(wpath)
            ch0 = data[:, 0] if data.ndim > 1 else data
            
            rms_v = np.sqrt(np.mean(ch0**2))
            peak_v = np.max(np.abs(ch0))
            feat_rec['vib_rms'] = rms_v
            feat_rec['vib_std'] = np.std(ch0)
            feat_rec['vib_peak'] = peak_v
            feat_rec['vib_p2p'] = np.ptp(ch0)
            feat_rec['vib_kurtosis'] = float(pd.Series(ch0).kurtosis())
            feat_rec['vib_skewness'] = float(pd.Series(ch0).skew())
            feat_rec['vib_crest_factor'] = peak_v / (rms_v + 1e-9)
            
            # Spectral centroid
            fft_v = np.abs(np.fft.rfft(ch0))
            freqs = np.fft.rfftfreq(len(ch0), 1/fs)
            feat_rec['vib_spectral_centroid'] = np.sum(freqs * fft_v) / (np.sum(fft_v) + 1e-9)

    # C. Vibrometer Spot Readings (.xls)
    xls_rows = group[group['sensor'] == 'vibration']
    if not xls_rows.empty:
        xpath = os.path.join(DATASET_DIR, xls_rows.iloc[0]['new_path'])
        if os.path.exists(xpath):
            try:
                df_x = pd.read_excel(xpath)
                vel_vals = df_x[df_x['Project Name'] == 'Velocity']['Value'].values
                acc_vals = df_x[df_x['Project Name'] == 'Acceleration']['Value'].values
                disp_vals = df_x[df_x['Project Name'] == 'Displacement']['Value'].values
                
                if len(vel_vals) > 0: feat_rec['spot_vel_mean'] = float(np.mean(vel_vals))
                if len(acc_vals) > 0: feat_rec['spot_acc_mean'] = float(np.mean(acc_vals))
                if len(disp_vals) > 0: feat_rec['spot_disp_mean'] = float(np.mean(disp_vals))
            except Exception as e:
                pass

    features_list.append(feat_rec)

df_feat = pd.DataFrame(features_list)
print(f"\nExtracted Feature Dataset: {df_feat.shape[0]} experiment records")
print("Null counts per feature:")
print(df_feat.isnull().sum())

# Fill missing spot readings at near-zero speeds with 0.0
spot_cols = ['spot_vel_mean', 'spot_acc_mean', 'spot_disp_mean']
for sc in spot_cols:
    if sc in df_feat.columns:
        df_feat[sc] = df_feat[sc].fillna(0.0)

# Drop any experiment missing current/vibration raw features
df_clean = df_feat.dropna(subset=['curr_rms', 'vib_rms']).reset_index(drop=True)
print(f"Clean Experiment Dataset for Training: {len(df_clean)} records")

# 4. DEFINE FEATURE SUBSETS FOR ABLATION STUDY
# Note: We EXCLUDE speed_percent and reversal from input features to PREVENT LEAKAGE!
feature_subsets = {
    'ESP32_Electrical_Only': [
        'curr_mean', 'curr_rms', 'curr_std', 'curr_peak', 'curr_p2p', 'curr_crest_factor',
        'curr_fft_peak', 'curr_fft_mean'
    ],
    'ESP32_Vibration_Only': [
        'vib_rms', 'vib_std', 'vib_peak', 'vib_p2p', 'vib_kurtosis', 'vib_skewness', 'vib_crest_factor',
        'vib_spectral_centroid'
    ],
    'ESP32_Spot_Only': [
        'spot_vel_mean', 'spot_acc_mean', 'spot_disp_mean'
    ],
    'ESP32_Compatible_Combined': [
        'curr_mean', 'curr_rms', 'curr_std', 'curr_peak', 'curr_p2p', 'curr_crest_factor',
        'vib_rms', 'vib_std', 'vib_peak', 'vib_p2p', 'vib_kurtosis', 'vib_skewness', 'vib_crest_factor',
        'spot_vel_mean', 'spot_acc_mean', 'spot_disp_mean'
    ]
}

# 5. STRATIFIED GROUP K-FOLD CROSS-VALIDATION
y = df_clean['health_label']
groups = df_clean['experiment_id']

print("\n==================================================")
print("FEATURE ABLATION & EVALUATION (5-Fold StratifiedGroupKFold)")
print("==================================================")

best_model_info = None
highest_f1 = -1.0

sgkf = StratifiedGroupKFold(n_splits=5)

for subset_name, feat_cols in feature_subsets.items():
    X = df_clean[feat_cols]
    
    # Evaluate Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
    
    y_true_all, y_pred_all = [], []
    
    for train_idx, val_idx in sgkf.split(X, y, groups=groups):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)
        
        rf.fit(X_train_scaled, y_train)
        preds = rf.predict(X_val_scaled)
        
        y_true_all.extend(y_val)
        y_pred_all.extend(preds)
    
    acc = accuracy_score(y_true_all, y_pred_all)
    macro_f1 = f1_score(y_true_all, y_pred_all, average='macro')
    weighted_f1 = f1_score(y_true_all, y_pred_all, average='weighted')
    
    print(f"\n--- Subset: {subset_name} ({len(feat_cols)} features) ---")
    print(f"  Grouped CV Accuracy: {acc*100:.2f}%")
    print(f"  Macro F1:            {macro_f1:.4f}")
    print(f"  Weighted F1:         {weighted_f1:.4f}")
    
    if macro_f1 > highest_f1:
        highest_f1 = macro_f1
        best_model_info = {
            'subset_name': subset_name,
            'feat_cols': feat_cols,
            'acc': acc,
            'macro_f1': macro_f1,
            'weighted_f1': weighted_f1,
            'y_true': y_true_all,
            'y_pred': y_pred_all
        }

# 6. DETAILED METRICS FOR SELECTED PRODUCTION MODEL
print("\n==================================================")
print("SELECTED PRODUCTION MODEL EVALUATION REPORT")
print("==================================================")
print(f"Selected Feature Subset: {best_model_info['subset_name']}")
print(f"Features ({len(best_model_info['feat_cols'])}): {best_model_info['feat_cols']}")
print(f"Grouped CV Accuracy: {best_model_info['acc']*100:.2f}%")
print(f"Macro F1 Score:      {best_model_info['macro_f1']:.4f}")

# Train final production model on full clean dataset
X_final = df_clean[best_model_info['feat_cols']]
y_final = df_clean['health_label']

final_scaler = StandardScaler()
X_final_scaled = final_scaler.fit_transform(X_final)

final_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6)
final_model.fit(X_final_scaled, y_final)

# Classification Report
print("\nDetailed Per-Class Classification Report:")
print(classification_report(best_model_info['y_true'], best_model_info['y_pred']))

# Confusion Matrix
labels = sorted(list(set(y_final)))
cm = confusion_matrix(best_model_info['y_true'], best_model_info['y_pred'], labels=labels)
df_cm = pd.DataFrame(cm, index=[f"True: {l}" for l in labels], columns=[f"Pred: {l}" for l in labels])
print("Confusion Matrix:")
print(df_cm.to_string())

# Feature Importances
importances = final_model.feature_importances_
df_imp = pd.DataFrame({
    'feature': best_model_info['feat_cols'],
    'importance': importances
}).sort_values('importance', ascending=False)
print("\nFeature Importance Ranking:")
print(df_imp.to_string(index=False))

# 7. SAVE MODEL ARTIFACTS
joblib.dump(final_model, os.path.join(MODEL_DIR, "model.joblib"))
joblib.dump(final_scaler, os.path.join(MODEL_DIR, "scaler.joblib"))

config_data = {
    "profile_name": "dc_motor_12v",
    "feature_subset": best_model_info['subset_name'],
    "feature_names": best_model_info['feat_cols'],
    "esp32_compatible": True,
    "class_labels": labels
}
with open(os.path.join(MODEL_DIR, "feature_config.json"), 'w') as f:
    json.dump(config_data, f, indent=2)

meta_data = {
    "model_type": "RandomForestClassifier",
    "target_name": "health_label",
    "n_classes": len(labels),
    "classes": labels,
    "grouped_cv_accuracy": float(best_model_info['acc']),
    "grouped_cv_macro_f1": float(best_model_info['macro_f1']),
    "feature_importance": df_imp.to_dict(orient='records'),
    "confusion_matrix": cm.tolist()
}
with open(os.path.join(MODEL_DIR, "metadata.json"), 'w') as f:
    json.dump(meta_data, f, indent=2)

print(f"\nModel artifacts successfully saved to: {MODEL_DIR}")

