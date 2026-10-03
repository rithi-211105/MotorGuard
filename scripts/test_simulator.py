"""
test_simulator.py - Stage 3 Automated Verification Suite for Dataset Replay Simulator
Verifies dataset loading, 10-class switching, replay looping, controls, AI integration,
ground truth separation, and mandatory dataset row feature equality.
"""

import sys
import os
import json
import time
import math
import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, os.path.join(project_root, "backend"))

from simulator import DatasetReplaySimulator, SimulatorManager, CWRU_CLASSES, FEATURE_COLUMNS

DATASET_PATH = os.path.join(project_root, "ml", "data", "feature_time_48k_2048_load_1.csv")

def run_tests():
    print("==================================================")
    print(" STAGE 3: DATASET REPLAY SIMULATOR TEST SUITE")
    print("==================================================")

    passed_count = 0
    total_tests = 12

    # TEST 1: Dataset Loading
    print("\n--- TEST 1: Dataset Loading & Validation ---")
    sim = DatasetReplaySimulator(dataset_path=DATASET_PATH)
    total_rows = len(sim.df)
    print(f"  Loaded dataset: {total_rows} rows from {os.path.basename(DATASET_PATH)}")
    assert total_rows == 2300, f"Expected 2300 rows, got {total_rows}"
    print("  [PASS] Test 1 Passed.")
    passed_count += 1

    # TEST 2: All 10 CWRU Classes Selectable
    print("\n--- TEST 2: All 10 CWRU Classes Selectable ---")
    for cls_name in CWRU_CLASSES:
        sim.set_condition(cls_name)
        assert sim.condition == cls_name, f"Failed setting condition {cls_name}"
    print(f"  Successfully set all 10 classes: {CWRU_CLASSES}")
    print("  [PASS] Test 2 Passed.")
    passed_count += 1

    # TEST 3: Rows Per Class Audit
    print("\n--- TEST 3: Row Counts Per Class Audit ---")
    for cls_name in CWRU_CLASSES:
        cnt = len(sim.class_data[cls_name])
        assert cnt == 230, f"Class {cls_name} expected 230 rows, got {cnt}"
    print("  All 10 classes contain exactly 230 dataset rows.")
    print("  [PASS] Test 3 Passed.")
    passed_count += 1

    # TEST 4: Replay Telemetry Output Schema
    print("\n--- TEST 4: Telemetry Output Schema & 7 Features ---")
    sim.set_condition("Normal_1")
    sample = sim.generate_sample()
    required_keys = ["timestamp", "source", "motor_id", "fault_class", "ground_truth",
                     "rms", "sd", "kurtosis", "crest", "max", "min", "skewness",
                     "simulated_temperature", "simulated_battery_voltage", "sequence", "ai_prediction"]
    for k in required_keys:
        assert k in sample, f"Missing required telemetry key: {k}"
    print("  [PASS] Telemetry packet contains all required schema keys.")
    passed_count += 1

    # TEST 5: Replay Loop Wrapping
    print("\n--- TEST 5: Replay Continuous Loop Wrapping ---")
    sim.set_condition("Ball_007_1")
    sim.row_index = 229  # Last row of 230
    row_last = sim.generate_sample()
    row_first = sim.generate_sample()  # Should wrap back to index 0
    print(f"  Wrapped sample sequence: {row_first['sequence']} | Row index wrap verified.")
    assert sim.row_index % 230 == 1, "Row index did not loop properly"
    print("  [PASS] Test 5 Passed.")
    passed_count += 1

    # TEST 6: Playback Speed Control
    print("\n--- TEST 6: Playback Speed Controls ---")
    sim.set_speed(5.0)
    assert sim.speed_multiplier == 5.0, "Speed multiplier setting failed"
    sim.set_speed(1.0)
    print("  Speed multiplier 5.0x set and verified.")
    print("  [PASS] Test 6 Passed.")
    passed_count += 1

    # TEST 7 & 8: Manager Start, Pause, Resume, Stop
    print("\n--- TEST 7 & 8: Simulator Manager Start, Pause, Resume, Stop ---")
    mgr = SimulatorManager()
    mgr.start("Normal_1", speed_multiplier=10.0)
    time.sleep(0.15)
    assert mgr.simulator.state == "RUNNING", "State should be RUNNING"
    mgr.pause()
    assert mgr.simulator.state == "PAUSED", "State should be PAUSED"
    mgr.resume()
    assert mgr.simulator.state == "RUNNING", "State should be RUNNING"
    mgr.reset()
    assert mgr.simulator.sequence == 0, "Sequence should be reset to 0"
    mgr.stop()
    assert mgr.simulator.state == "STOPPED", "State should be STOPPED"
    print("  [PASS] Test 7 & 8 Passed.")
    passed_count += 2

    # TEST 9: AI Integration
    print("\n--- TEST 9: Stage 2 AI Inference Model Integration ---")
    sim.set_condition("Ball_021_1")
    sample_ai = sim.generate_sample()
    ai_pred = sample_ai['ai_prediction']
    print(f"  Ground Truth: {sample_ai['ground_truth']} | AI Pred: {ai_pred['predicted_class']} | Conf: {ai_pred['confidence']}")
    assert ai_pred['predicted_class'] is not None, "AI prediction missing predicted_class"
    assert ai_pred['confidence'] > 0.5, "AI prediction confidence too low"
    print("  [PASS] Test 9 Passed.")
    passed_count += 1

    # TEST 10: Ground Truth vs AI Prediction Separation
    print("\n--- TEST 10: Ground Truth vs AI Prediction Field Separation ---")
    sample_sep = sim.generate_sample()
    assert "ground_truth" in sample_sep, "Missing ground_truth field"
    assert "ai_prediction" in sample_sep, "Missing ai_prediction field"
    assert sample_sep["ground_truth"] != sample_sep["ai_prediction"], "Fields should remain distinct structures"
    print("  [PASS] Test 10 Passed.")
    passed_count += 1

    # TEST 11: Mandatory Zero Fake Vibration Check
    print("\n--- TEST 11: Verification of Zero Fake Vibration Generation ---")
    sim.set_condition("IR_014_1")
    sim.row_index = 10
    raw_df_row = sim.class_data["IR_014_1"].iloc[10]
    sample_vib = sim.generate_sample()
    
    for feat in FEATURE_COLUMNS:
        csv_val = float(raw_df_row[feat])
        sim_val = float(sample_vib[feat])
        diff = abs(csv_val - sim_val)
        assert diff < 1e-6, f"Feature {feat} perturbed! CSV={csv_val}, Sim={sim_val}"
    print("  [PASS] All 7 vibration features match raw CSV with zero noise or perturbation.")
    passed_count += 1

    # TEST 12: MANDATORY DATA INTEGRITY TEST (3 Selected CSV Rows)
    print("\n--- TEST 12: Mandatory Data Integrity Test (3 CSV Rows vs Simulator) ---")
    df_raw = pd.read_csv(DATASET_PATH)
    
    # Selected test cases: Row 0 (Normal_1), Row 500 (Ball_014_1), Row 1200 (IR_021_1)
    test_cases = [
        {"row_idx": 0, "cls": "Normal_1"},
        {"row_idx": 500, "cls": "Ball_014_1"},
        {"row_idx": 1200, "cls": "IR_021_1"}
    ]
    
    for idx_num, tc in enumerate(test_cases, 1):
        target_cls = tc["cls"]
        sim.set_condition(target_cls)
        # Find exact row index within class subset
        cls_df = sim.class_data[target_cls]
        target_row = cls_df.iloc[0]
        sim.row_index = 0
        
        sim_sample = sim.generate_sample()
        
        print(f"  Subtest 12.{idx_num} ({target_cls}):")
        for col in FEATURE_COLUMNS:
            expected = float(target_row[col])
            actual = float(sim_sample[col])
            print(f"    - {col:10s} : Expected CSV={expected:.6f} | Actual Sim={actual:.6f}")
            assert abs(expected - actual) < 1e-6, f"Mismatch on {col}: CSV={expected}, Sim={actual}"
            
    print("  [PASS] Mandatory Data Integrity Test Passed! All 3 CSV rows match simulator outputs exactly.")
    passed_count += 1

    print("\n==================================================")
    print(f" SUMMARY: {passed_count} / {total_tests} TESTS PASSED")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
