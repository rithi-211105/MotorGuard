"""
ai_engine.py - Standardized AI Inference Engine Layer
Loads CWRU motor ML model and scaler from backend/models/
Performs strict feature validation and multi-class bearing fault classification.
"""

import sys
import os
import json
import time
import joblib
import numpy as np
import warnings
warnings.filterwarnings('ignore')

FEATURE_COLUMNS = ["rms", "sd", "kurtosis", "crest", "max", "min", "skewness"]

script_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(script_dir, "models")

model_path = os.path.join(models_dir, "motor_best_model.joblib")
scaler_path = os.path.join(models_dir, "motor_scaler.joblib")
metadata_path = os.path.join(models_dir, "model_metadata.json")

MODEL = None
SCALER = None
METADATA = None

DC_MODEL = None
DC_SCALER = None
DC_CONFIG = None
DC_METADATA = None

def load_ai_artifacts():
    global MODEL, SCALER, METADATA
    if MODEL is None and os.path.exists(model_path):
        MODEL = joblib.load(model_path)
    if SCALER is None and os.path.exists(scaler_path):
        SCALER = joblib.load(scaler_path)
    if METADATA is None and os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            METADATA = json.load(f)

def load_dc_artifacts():
    global DC_MODEL, DC_SCALER, DC_CONFIG, DC_METADATA
    dc_dir = os.path.join(models_dir, "dc_motor")
    m_path = os.path.join(dc_dir, "model.joblib")
    s_path = os.path.join(dc_dir, "scaler.joblib")
    c_path = os.path.join(dc_dir, "feature_config.json")
    meta_path = os.path.join(dc_dir, "metadata.json")
    
    if DC_MODEL is None and os.path.exists(m_path):
        DC_MODEL = joblib.load(m_path)
    if DC_SCALER is None and os.path.exists(s_path):
        DC_SCALER = joblib.load(s_path)
    if DC_CONFIG is None and os.path.exists(c_path):
        with open(c_path, 'r') as f:
            DC_CONFIG = json.load(f)
    if DC_METADATA is None and os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            DC_METADATA = json.load(f)

def get_ai_status(profile="cwru_2hp"):
    if profile == "dc_motor_12v":
        load_dc_artifacts()
        if DC_METADATA is None:
            return {
                "status": "UNAVAILABLE",
                "message": "12V DC Motor AI artifacts not loaded."
            }
        return {
            "status": "ONLINE",
            "best_model": DC_METADATA.get("model_type", "RandomForestClassifier"),
            "model_version": "v1.0-dc_motor_12v",
            "feature_columns": DC_CONFIG.get("feature_names", []),
            "class_names": DC_METADATA.get("classes", []),
            "accuracy": DC_METADATA.get("grouped_cv_accuracy"),
            "f1_score_macro": DC_METADATA.get("grouped_cv_macro_f1"),
            "profile_name": "dc_motor_12v"
        }
    
    load_ai_artifacts()
    if METADATA is None:
        return {
            "status": "UNAVAILABLE",
            "message": "AI model artifacts not loaded."
        }
    return {
        "status": "ONLINE",
        "best_model": METADATA.get("best_model", "Lightweight Neural Net (MLP)"),
        "model_version": METADATA.get("model_version", "v2.0-cwru-standardized"),
        "feature_columns": METADATA.get("feature_columns", FEATURE_COLUMNS),
        "class_names": METADATA.get("class_names", []),
        "accuracy": METADATA.get("accuracy"),
        "f1_score_macro": METADATA.get("f1_score_macro"),
        "training_timestamp": METADATA.get("training_timestamp"),
        "profile_name": "cwru_2hp"
    }

def generate_recommendation(predicted_class, is_healthy):
    if is_healthy or predicted_class in ['Normal_1', 'Normal Operation']:
        return "All motor vibration and electrical metrics are within nominal Operating Bounds. No maintenance required."
    
    class_map = {
        'Ball_007_1': 'Mild Ball Bearing Defect (0.007")',
        'Ball_014_1': 'Moderate Ball Bearing Defect (0.014")',
        'Ball_021_1': 'Severe Ball Bearing Defect (0.021")',
        'IR_007_1': 'Mild Inner Race Bearing Defect (0.007")',
        'IR_014_1': 'Moderate Inner Race Bearing Defect (0.014")',
        'IR_021_1': 'Severe Inner Race Bearing Defect (0.021")',
        'OR_007_6_1': 'Mild Outer Race Bearing Defect (0.007")',
        'OR_014_6_1': 'Moderate Outer Race Bearing Defect (0.014")',
        'OR_021_6_1': 'Severe Outer Race Bearing Defect (0.021")',
        'Loose Foundation': 'Loose Motor Foundation / Mechanical Looseness',
        'Suboptimal Control (Speed Reg)': 'Suboptimal Speed Regulator Gain Setting',
        'Suboptimal Control (Speed+Current Reg)': 'Suboptimal Speed & Current Regulator Gain Setting'
    }
    
    desc = class_map.get(predicted_class, f"Operating Anomaly ({predicted_class})")
    
    if '021' in predicted_class or 'Speed+Current' in predicted_class:
        return f"CRITICAL: {desc} detected. Schedule immediate inspection and parameter calibration."
    elif '014' in predicted_class or 'Loose Foundation' in predicted_class:
        return f"WARNING: {desc} detected. Inspect mounting hardware and monitor trend."
    else:
        return f"ATTENTION: {desc} detected. Verify drive parameters and regulator tuning."

def validate_and_extract_features(input_data):
    """
    Validates and extracts the 7 canonical features in exact order:
    ['rms', 'sd', 'kurtosis', 'crest', 'max', 'min', 'skewness']
    """
    if isinstance(input_data, list):
        if len(input_data) != len(FEATURE_COLUMNS):
            raise ValueError(f"Feature vector must contain exactly {len(FEATURE_COLUMNS)} values. Received {len(input_data)}.")
        try:
            return [float(v) for v in input_data]
        except (ValueError, TypeError):
            raise ValueError("All feature values in vector must be numeric.")

    if isinstance(input_data, dict):
        extracted = []
        missing = []
        for col in FEATURE_COLUMNS:
            val = input_data.get(col)
            # Fallback key check if alias exists
            if val is None and col == 'rms' and 'accel_rms' in input_data:
                val = input_data['accel_rms']
            if val is None and col == 'max' and 'accel_peak' in input_data:
                val = input_data['accel_peak']
            if val is None and col == 'min' and 'accel_peak' in input_data:
                val = -float(input_data['accel_peak'])

            if val is None:
                missing.append(col)
            else:
                try:
                    v_float = float(val)
                    if np.isnan(v_float) or np.isinf(v_float):
                        raise ValueError(f"Feature '{col}' cannot be NaN or Inf.")
                    extracted.append(v_float)
                except (ValueError, TypeError) as e:
                    raise ValueError(f"Feature '{col}' must be a valid numeric number. Received: {val}")

        if missing:
            raise ValueError(f"Missing required feature keys: {missing}. Canonical 7 features required: {FEATURE_COLUMNS}")

        return extracted

    raise ValueError("Input data must be a dictionary or list of canonical 7 features.")

def extract_dc_features_from_current_samples(current_samples):
    """
    Extracts the 8 canonical DC motor electrical features from raw current sample array.
    Used by ESP32 raw telemetry endpoint and live inference pipeline.
    """
    if not isinstance(current_samples, (list, tuple, np.ndarray)):
        raise ValueError("current_samples must be a list or array of numeric current readings.")
    arr = np.array(current_samples, dtype=np.float64)
    if len(arr) < 32:
        raise ValueError(f"Insufficient current samples for feature extraction. Minimum 32 required, got {len(arr)}.")
    if np.any(np.isnan(arr)) or np.any(np.isinf(arr)):
        raise ValueError("Current samples contain NaN or Inf values.")

    curr_mean = float(np.mean(arr))
    curr_rms = float(np.sqrt(np.mean(arr ** 2)))
    curr_std = float(np.std(arr))
    curr_peak = float(np.max(np.abs(arr)))
    curr_p2p = float(np.ptp(arr))
    curr_crest_factor = float(curr_peak / (curr_rms + 1e-9))

    ac_component = arr - curr_mean
    fft_vals = np.abs(np.fft.rfft(ac_component))
    curr_fft_peak = float(np.max(fft_vals)) if len(fft_vals) > 0 else 0.0
    curr_fft_mean = float(np.mean(fft_vals)) if len(fft_vals) > 0 else 0.0

    return {
        'curr_mean': curr_mean,
        'curr_rms': curr_rms,
        'curr_std': curr_std,
        'curr_peak': curr_peak,
        'curr_p2p': curr_p2p,
        'curr_crest_factor': curr_crest_factor,
        'curr_fft_peak': curr_fft_peak,
        'curr_fft_mean': curr_fft_mean
    }

def predict_dc_motor(input_data):
    load_dc_artifacts()
    if DC_MODEL is None or DC_SCALER is None or DC_CONFIG is None:
        raise RuntimeError("12V DC Motor model artifacts not loaded.")

    t0 = time.time()
    feature_cols = DC_CONFIG.get("feature_names", [
        "curr_mean", "curr_rms", "curr_std", "curr_peak",
        "curr_p2p", "curr_crest_factor", "curr_fft_peak", "curr_fft_mean"
    ])
    
    extracted_features = None
    if isinstance(input_data, dict):
        if "current_samples" in input_data or "raw_current" in input_data:
            samples = input_data.get("current_samples") or input_data.get("raw_current")
            extracted_features = extract_dc_features_from_current_samples(samples)
        else:
            missing = [c for c in feature_cols if c not in input_data]
            if missing:
                raise ValueError(f"Missing required DC feature keys: {missing}. Exact 8 features required: {feature_cols}")
            extracted_features = {}
            for col in feature_cols:
                v = input_data[col]
                try:
                    v_float = float(v)
                    if np.isnan(v_float) or np.isinf(v_float):
                        raise ValueError(f"Feature '{col}' cannot be NaN or Inf.")
                    extracted_features[col] = v_float
                except (ValueError, TypeError):
                    raise ValueError(f"Feature '{col}' must be a valid numeric value. Got: {v}")

    elif isinstance(input_data, (list, tuple)):
        if len(input_data) != len(feature_cols):
            raise ValueError(f"Feature vector must contain exactly {len(feature_cols)} values. Received {len(input_data)}.")
        extracted_features = {}
        for i, col in enumerate(feature_cols):
            try:
                v_float = float(input_data[i])
                if np.isnan(v_float) or np.isinf(v_float):
                    raise ValueError(f"Feature '{col}' cannot be NaN or Inf.")
                extracted_features[col] = v_float
            except (ValueError, TypeError):
                raise ValueError(f"Feature at index {i} ('{col}') must be numeric. Received: {input_data[i]}")
    else:
        raise ValueError("Input data must be a dictionary or list containing the 8 canonical DC motor electrical features.")

    feature_vals = [extracted_features[col] for col in feature_cols]
    
    scaled_vector = DC_SCALER.transform([feature_vals])
    pred_val = DC_MODEL.predict(scaled_vector)[0]
    
    classes = DC_CONFIG.get("class_labels", [
        "Loose Foundation", "Normal Operation",
        "Suboptimal Control (Speed Reg)", "Suboptimal Control (Speed+Current Reg)"
    ])
    
    if isinstance(pred_val, (int, np.integer)):
        predicted_class = classes[int(pred_val)] if int(pred_val) < len(classes) else str(pred_val)
    else:
        predicted_class = str(pred_val)
    
    class_probs = {}
    if hasattr(DC_MODEL, "predict_proba"):
        probs = DC_MODEL.predict_proba(scaled_vector)[0]
        confidence = float(np.max(probs))
        model_classes = list(getattr(DC_MODEL, "classes_", classes))
        class_probs = {str(model_classes[i]): float(probs[i]) for i in range(len(model_classes))}
        normal_prob = class_probs.get('Normal Operation', 0.0)
    else:
        confidence = 1.0
        normal_prob = 1.0 if predicted_class == 'Normal Operation' else 0.0

    is_healthy = (predicted_class == 'Normal Operation')
    status = "HEALTHY" if is_healthy else "OPERATING ANOMALY DETECTED"
    severity = "normal" if is_healthy else ("critical" if "Speed+Current" in predicted_class else "warning")
    
    condition_score = round(normal_prob * 100, 2)
    prototype_anomaly_indicator = round((1.0 - normal_prob), 4)
    inference_time_ms = (time.time() - t0) * 1000

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence, 4),
        "status": status,
        "is_healthy": is_healthy,
        "severity": severity,
        "condition_score": condition_score,
        "anomaly_score": prototype_anomaly_indicator,
        "prototype_anomaly_indicator": prototype_anomaly_indicator,
        "score_label": "model-based condition score",
        "features": extracted_features,
        "class_probabilities": class_probs,
        "model_name": DC_METADATA.get('model_type', 'RandomForestClassifier') if DC_METADATA else 'RandomForestClassifier',
        "model_version": "v1.0-dc_motor_12v",
        "recommendation": generate_recommendation(predicted_class, is_healthy),
        "inference_time_ms": round(inference_time_ms, 4)
    }

def predict(input_data, profile="cwru_2hp"):
    if profile == "dc_motor_12v":
        return predict_dc_motor(input_data)
        
    load_ai_artifacts()
    
    if MODEL is None or SCALER is None:
        raise RuntimeError("AI model or scaler artifacts not loaded.")

    t0 = time.time()
    
    feature_vals = validate_and_extract_features(input_data)
    feature_dict = {col: feature_vals[i] for i, col in enumerate(FEATURE_COLUMNS)}

    feature_vector = np.array([feature_vals])
    scaled_vector = SCALER.transform(feature_vector)
    
    pred_idx = MODEL.predict(scaled_vector)[0]
    
    class_names = METADATA.get('class_names', [
        'Ball_007_1', 'Ball_014_1', 'Ball_021_1', 'IR_007_1', 'IR_014_1', 'IR_021_1',
        'Normal_1', 'OR_007_6_1', 'OR_014_6_1', 'OR_021_6_1'
    ])
    
    predicted_class = class_names[pred_idx] if pred_idx < len(class_names) else str(pred_idx)
    
    # Calculate actual probability confidence
    class_probs = {}
    if hasattr(MODEL, "predict_proba"):
        probs = MODEL.predict_proba(scaled_vector)[0]
        confidence = float(np.max(probs))
        class_probs = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
        normal_idx = class_names.index('Normal_1') if 'Normal_1' in class_names else -1
        normal_prob = float(probs[normal_idx]) if normal_idx != -1 else 0.0
    else:
        confidence = 1.0
        normal_prob = 1.0 if predicted_class == 'Normal_1' else 0.0

    is_healthy = (predicted_class == 'Normal_1')
    status = "HEALTHY" if is_healthy else "FAULT DETECTED"
    
    if is_healthy:
        severity = "normal"
    elif '021' in predicted_class:
        severity = "critical"
    elif '014' in predicted_class:
        severity = "warning"
    else:
        severity = "warning"

    condition_score = round(normal_prob * 100, 2)
    prototype_anomaly_indicator = round((1.0 - normal_prob), 4)
    inference_time_ms = (time.time() - t0) * 1000

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence, 4),
        "status": status,
        "is_healthy": is_healthy,
        "severity": severity,
        "condition_score": condition_score,
        "anomaly_score": prototype_anomaly_indicator,
        "prototype_anomaly_indicator": prototype_anomaly_indicator,
        "score_label": "model-based condition score",
        "features": feature_dict,
        "class_probabilities": class_probs,
        "model_name": METADATA.get('best_model', 'Lightweight Neural Net (MLP)'),
        "model_version": METADATA.get('model_version', 'v2.0-cwru-standardized'),
        "recommendation": generate_recommendation(predicted_class, is_healthy),
        "inference_time_ms": round(inference_time_ms, 4)
    }

if __name__ == "__main__":
    load_ai_artifacts()
    print("AI Engine Status (cwru_2hp):", get_ai_status("cwru_2hp"))
    print("AI Engine Status (dc_motor_12v):", get_ai_status("dc_motor_12v"))

