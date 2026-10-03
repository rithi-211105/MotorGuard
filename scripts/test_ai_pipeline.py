"""
test_ai_pipeline.py - Stage 2 Comprehensive Test Suite for Motor AI Pipeline
Tests inference accuracy on real CWRU 2 HP motor dataset rows and input validation.
"""

import sys
import os
import json
import pandas as pd
import requests

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, os.path.join(project_root, "backend"))

import ai_engine

DATASET_PATH = os.path.join(project_root, "ml", "data", "feature_time_48k_2048_load_1.csv")

def run_tests():
    print("==================================================")
    print(" STAGE 2: AI PIPELINE & FEATURE VALIDATION TEST SUITE")
    print("==================================================")

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset missing at: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    print(f"[OK] Dataset Loaded: {len(df)} rows")

    FEATURE_COLUMNS = ["rms", "sd", "kurtosis", "crest", "max", "min", "skewness"]

    passed_count = 0
    total_tests = 8

    # TEST 1: Real Normal Dataset Row
    print("\n--- TEST 1: Real Normal Dataset Row (Normal_1) ---")
    normal_rows = df[df['fault'] == 'Normal_1']
    sample_normal = normal_rows.iloc[0][FEATURE_COLUMNS].to_dict()
    res1 = ai_engine.predict(sample_normal)
    print(f"  Expected: Normal_1 | Predicted: {res1['predicted_class']} | Status: {res1['status']} | Conf: {res1['confidence']}")
    assert res1['predicted_class'] == 'Normal_1', f"Expected Normal_1, got {res1['predicted_class']}"
    assert res1['status'] == 'HEALTHY', "Expected status HEALTHY"
    print("  [PASS] Test 1 Passed.")
    passed_count += 1

    # TEST 2: Real Ball Fault Row
    print("\n--- TEST 2: Real Ball Fault Row (Ball_014_1) ---")
    ball_rows = df[df['fault'] == 'Ball_014_1']
    sample_ball = ball_rows.iloc[0][FEATURE_COLUMNS].to_dict()
    res2 = ai_engine.predict(sample_ball)
    print(f"  Expected: Ball_014_1 | Predicted: {res2['predicted_class']} | Status: {res2['status']} | Conf: {res2['confidence']}")
    assert res2['predicted_class'] == 'Ball_014_1', f"Expected Ball_014_1, got {res2['predicted_class']}"
    assert res2['status'] == 'FAULT DETECTED', "Expected status FAULT DETECTED"
    print("  [PASS] Test 2 Passed.")
    passed_count += 1

    # TEST 3: Real Inner-Race Fault Row
    print("\n--- TEST 3: Real Inner-Race Fault Row (IR_021_1) ---")
    ir_rows = df[df['fault'] == 'IR_021_1']
    sample_ir = ir_rows.iloc[0][FEATURE_COLUMNS].to_dict()
    res3 = ai_engine.predict(sample_ir)
    print(f"  Expected: IR_021_1 | Predicted: {res3['predicted_class']} | Status: {res3['status']} | Conf: {res3['confidence']}")
    assert res3['predicted_class'] == 'IR_021_1', f"Expected IR_021_1, got {res3['predicted_class']}"
    assert res3['status'] == 'FAULT DETECTED', "Expected status FAULT DETECTED"
    print("  [PASS] Test 3 Passed.")
    passed_count += 1

    # TEST 4: Real Outer-Race Fault Row
    print("\n--- TEST 4: Real Outer-Race Fault Row (OR_007_6_1) ---")
    or_rows = df[df['fault'] == 'OR_007_6_1']
    sample_or = or_rows.iloc[0][FEATURE_COLUMNS].to_dict()
    res4 = ai_engine.predict(sample_or)
    print(f"  Expected: OR_007_6_1 | Predicted: {res4['predicted_class']} | Status: {res4['status']} | Conf: {res4['confidence']}")
    assert res4['predicted_class'] == 'OR_007_6_1', f"Expected OR_007_6_1, got {res4['predicted_class']}"
    assert res4['status'] == 'FAULT DETECTED', "Expected status FAULT DETECTED"
    print("  [PASS] Test 4 Passed.")
    passed_count += 1

    # TEST 5: Missing Feature Validation
    print("\n--- TEST 5: Missing Feature Validation ---")
    incomplete_sample = {"rms": 0.033, "sd": 0.010, "kurtosis": 3.1} # Missing crest, max, min, skewness
    try:
        ai_engine.predict(incomplete_sample)
        print("  [FAIL] Expected ValueError for missing features, but prediction executed!")
    except ValueError as ve:
        print(f"  [PASS] Cleanly rejected incomplete feature input: {ve}")
        passed_count += 1

    # TEST 6: Invalid / Non-Numeric Feature Validation
    print("\n--- TEST 6: Invalid / Non-Numeric Feature Validation ---")
    invalid_sample = {"rms": "INVALID_NUM", "sd": 0.01, "kurtosis": 3.1, "crest": 3.2, "max": 0.12, "min": -0.11, "skewness": 0.02}
    try:
        ai_engine.predict(invalid_sample)
        print("  [FAIL] Expected ValueError for invalid string feature, but prediction executed!")
    except ValueError as ve:
        print(f"  [PASS] Cleanly rejected non-numeric feature input: {ve}")
        passed_count += 1

    # TEST 7: AI Status Check
    print("\n--- TEST 7: AI Model Status Verification ---")
    status = ai_engine.get_ai_status()
    print(f"  Status: {status.get('status')} | Active Model: {status.get('best_model')} | Acc: {status.get('accuracy')}")
    assert status.get('status') == 'ONLINE', "AI status should be ONLINE"
    print("  [PASS] Test 7 Passed.")
    passed_count += 1

    # TEST 8: Arbitrary Dictionary Key Ordering
    print("\n--- TEST 8: Canonical Feature Order Preservation ---")
    # Dict with keys out of order
    shuffled_sample = {
        "skewness": -0.118,
        "min": -0.418,
        "rms": 0.124,
        "max": 0.359,
        "crest": 2.901,
        "kurtosis": -0.042,
        "sd": 0.122
    }
    res8 = ai_engine.predict(shuffled_sample)
    print(f"  Shuffled Key Input -> Predicted Class: {res8['predicted_class']} | Features Ordered: {list(res8['features'].keys())}")
    assert list(res8['features'].keys()) == FEATURE_COLUMNS, "Canonical feature order was not preserved"
    print("  [PASS] Test 8 Passed.")
    passed_count += 1

    print("\n==================================================")
    print(f" SUMMARY: {passed_count} / {total_tests} TESTS PASSED")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
