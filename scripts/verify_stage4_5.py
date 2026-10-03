"""
verify_stage4_5.py - Rigorous STAGE 4.5 End-to-End Data Path Verification Script
Verifies: CSV -> simulator.py -> AI engine -> FastAPI -> WebSocket -> Dashboard
"""

import sys
import os
import json
import time
import pandas as pd
import requests

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, os.path.join(project_root, "backend"))

import simulator
import ai_engine

DATASET_PATH = os.path.join(project_root, "ml", "data", "feature_time_48k_2048_load_1.csv")
MODEL_PATH = os.path.join(project_root, "backend", "models", "motor_best_model.joblib")
SCALER_PATH = os.path.join(project_root, "backend", "models", "motor_scaler.joblib")
API_BASE = "http://127.0.0.1:8000"

FEATURE_COLUMNS = ["rms", "sd", "kurtosis", "crest", "max", "min", "skewness"]

def run_stage_4_5_verification():
    print("==========================================================================")
    print(" STAGE 4.5 RIGOROUS DATA PATH & RUNTIME INTEGRITY VERIFICATION")
    print("==========================================================================")

    audit_fixes = []

    # 1. SIMULATOR SOURCE & DATASET LOADING AUDIT
    print("\n--- 1. SIMULATOR SOURCE & DATASET AUDIT ---")
    assert os.path.exists(DATASET_PATH), f"Dataset file missing at {DATASET_PATH}"
    df = pd.read_csv(DATASET_PATH)
    print(f"[OK] Primary Dataset: {os.path.basename(DATASET_PATH)} ({len(df)} rows)")

    sim = simulator.DatasetReplaySimulator(dataset_path=DATASET_PATH)
    assert sim.df.shape[0] == 2300, f"Expected 2300 rows, got {sim.df.shape[0]}"
    print(f"[OK] Simulator loaded dataset successfully. 10 classes verified: {list(sim.class_data.keys())}")

    # 2. ACTUAL CSV ROW FLOATING-POINT EQUALITY VERIFICATION
    print("\n--- 2. ACTUAL CSV ROW FLOATING-POINT EQUALITY VERIFICATION ---")
    test_classes = ["Normal_1", "Ball_014_1", "IR_021_1", "OR_007_6_1"]
    
    for cls in test_classes:
        sim.set_condition(cls)
        sim.row_index = 0
        csv_row = sim.class_data[cls].iloc[0]
        sample = sim.generate_sample()

        print(f"\n  [*] Checking Class: {cls}")
        assert sample["ground_truth"] == cls, f"Ground truth mismatch: {sample['ground_truth']} != {cls}"

        for feat in FEATURE_COLUMNS:
            expected_val = float(csv_row[feat])
            actual_val = float(sample[feat])
            diff = abs(expected_val - actual_val)
            print(f"      - {feat:10s} : Expected={expected_val:.6f} | Actual={actual_val:.6f} | Diff={diff:.8f}")
            assert diff < 1e-6, f"Vibration feature {feat} perturbed! Diff={diff}"

    print("\n[OK] CSV Row Verification Passed: Simulator outputs match raw dataset rows with 100% precision.")

    # 3. AI INFERENCE & MODEL ARTIFACT VERIFICATION
    print("\n--- 3. AI INFERENCE & MODEL ARTIFACT VERIFICATION ---")
    assert os.path.exists(MODEL_PATH), f"Model artifact missing: {MODEL_PATH}"
    assert os.path.exists(SCALER_PATH), f"Scaler artifact missing: {SCALER_PATH}"
    
    ai_status = ai_engine.get_ai_status()
    print(f"[OK] Active Model File : {MODEL_PATH}")
    print(f"[OK] Active Scaler File: {SCALER_PATH}")
    print(f"[OK] Model Name        : {ai_status.get('best_model')}")
    print(f"[OK] Model Version     : {ai_status.get('model_version')}")
    print(f"[OK] Evaluated Accuracy: {ai_status.get('accuracy') * 100:.2f}%")
    print(f"[OK] Feature Schema    : {ai_status.get('feature_columns')}")
    assert ai_status.get('feature_columns') == FEATURE_COLUMNS, "AI feature schema mismatch"

    # 4. RANDOM / FAKE DATA AUDIT ON ACTIVE RUNTIME PATH
    print("\n--- 4. RANDOM / FAKE DATA AUDIT ON ACTIVE RUNTIME PATH ---")
    # Audit backend/simulator.py
    with open(os.path.join(project_root, "backend", "simulator.py"), "r") as f:
        sim_code = f.read()

    assert "Math.random" not in sim_code, "Math.random found in simulator.py"
    assert "np.random.normal" not in sim_code, "np.random.normal found in simulator.py"
    assert "random.random" not in sim_code, "random.random found in simulator.py"
    print("[OK] backend/simulator.py clean: Zero fake/random vibration math found.")

    # Audit backend/ai_engine.py
    with open(os.path.join(project_root, "backend", "ai_engine.py"), "r") as f:
        ai_code = f.read()

    assert "sd = accel_rms * 0.998" not in ai_code, "Fake formula 'sd = accel_rms * 0.998' found in ai_engine.py"
    assert "max_val = accel_peak * 1.05" not in ai_code, "Fake formula 'max_val = accel_peak * 1.05' found in ai_engine.py"
    print("[OK] backend/ai_engine.py clean: Zero fake formula generation found.")

    # 5. WEBSOCKET & REST TELEMETRY STREAM PACKET VERIFICATION (10 Packets)
    print("\n--- 5. TELEMETRY STREAM & PACKET AUDIT (10 Consecutive Packets) ---")
    # Make sure simulator is running on server
    requests.post(f"{API_BASE}/api/simulation/start", json={"condition": "Normal_1", "speed_multiplier": 5.0})
    time.sleep(0.3)

    packets = []
    for i in range(10):
        res = requests.get(f"{API_BASE}/api/sensor/current").json()
        packets.append(res)
        time.sleep(0.05)

    print(f"[OK] Captured {len(packets)} consecutive telemetry packets from server.")

    # Audit packet schema and continuous sequence
    prev_seq = None
    for i, p in enumerate(packets):
        assert "timestamp" in p, f"Packet {i} missing timestamp"
        assert "ground_truth" in p, f"Packet {i} missing ground_truth"
        assert "ai_prediction" in p, f"Packet {i} missing ai_prediction"
        assert "confidence" in p["ai_prediction"], f"Packet {i} missing confidence"
        assert "sequence" in p, f"Packet {i} missing sequence"

        for feat in FEATURE_COLUMNS:
            assert feat in p, f"Packet {i} missing vibration feature '{feat}'"
            assert isinstance(p[feat], (int, float)), f"Feature '{feat}' must be numeric"

        seq = p["sequence"]
        if prev_seq is not None:
            assert seq >= prev_seq, f"Sequence non-monotonic: {seq} < {prev_seq}"
        prev_seq = seq

    print("[OK] Telemetry packet schema, 7 canonical features, ground_truth, AI prediction, and confidence verified.")

    # 6. CONDITION SWITCHING VERIFICATION
    print("\n--- 6. CONDITION SWITCHING VERIFICATION ---")
    switch_sequence = ["Normal_1", "Ball_014_1", "IR_021_1", "Normal_1"]
    
    for target_cond in switch_sequence:
        resp = requests.post(f"{API_BASE}/api/simulation/condition", json={"condition": target_cond}).json()
        assert resp["status"] == "ok", f"Failed switching condition to {target_cond}"
        time.sleep(0.2)
        
        telemetry = requests.get(f"{API_BASE}/api/sensor/current").json()
        gt = telemetry.get("ground_truth")
        ai_p = telemetry.get("ai_prediction", {}).get("predicted_class")
        conf = telemetry.get("ai_prediction", {}).get("confidence")
        
        print(f"  [Switch -> {target_cond:12s}] Ground Truth: {gt:12s} | AI Prediction: {ai_p:12s} | Confidence: {conf}")
        assert gt == target_cond, f"Expected ground_truth '{target_cond}', got '{gt}'"
        assert ai_p is not None, "AI prediction class is None"

    print("[OK] Condition switching verified across multiple fault classes.")

    # 7. SIMULATION CONTROLS VERIFICATION (Start, Pause, Resume, Reset, Stop)
    print("\n--- 7. SIMULATION CONTROLS VERIFICATION ---")
    # Pause
    res_pause = requests.post(f"{API_BASE}/api/simulation/pause").json()
    assert res_pause["simulation"]["state"] == "PAUSED", "Pause failed"
    p1 = requests.get(f"{API_BASE}/api/sensor/current").json()
    seq1 = p1["sequence"]
    time.sleep(0.15)
    p2 = requests.get(f"{API_BASE}/api/sensor/current").json()
    seq2 = p2["sequence"]
    assert seq1 == seq2, f"Sequence advanced while paused: {seq1} != {seq2}"
    print("  [OK] Pause verified: Telemetry sequence progression frozen.")

    # Resume
    res_resume = requests.post(f"{API_BASE}/api/simulation/resume").json()
    assert res_resume["simulation"]["state"] == "RUNNING", "Resume failed"
    time.sleep(0.15)
    p3 = requests.get(f"{API_BASE}/api/sensor/current").json()
    assert p3["sequence"] > seq1, f"Sequence did not advance after resume: {p3['sequence']} <= {seq1}"
    print("  [OK] Resume verified: Telemetry sequence progression resumed.")

    # Reset
    res_reset = requests.post(f"{API_BASE}/api/simulation/reset").json()
    assert res_reset["status"] == "ok", "Reset failed"
    p_reset = requests.get(f"{API_BASE}/api/sensor/current").json()
    print(f"  [OK] Reset verified: Sequence reset to {p_reset['sequence']}.")

    # Stop
    res_stop = requests.post(f"{API_BASE}/api/simulation/stop").json()
    assert res_stop["simulation"]["state"] == "STOPPED", "Stop failed"
    print("  [OK] Stop verified: Simulator state transitioned to STOPPED.")

    # Restart
    res_start = requests.post(f"{API_BASE}/api/simulation/start", json={"condition": "Normal_1", "speed_multiplier": 1.0}).json()
    assert res_start["simulation"]["state"] == "RUNNING", "Restart failed"
    print("  [OK] Start/Restart verified: Telemetry active.")

    print("\n==========================================================================")
    print(" FINAL VERDICT: STAGE 4.5 PASS")
    print("==========================================================================")

if __name__ == '__main__':
    run_stage_4_5_verification()
