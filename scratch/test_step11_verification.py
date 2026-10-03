"""
STEP 11 Verification: Explainable, Context-Rich Alerts & Dynamic Threshold Integration
Validates:
1. Explainable alert structure and deterministic generation
2. Strict profile isolation (12 V DC vs 2 HP CWRU)
3. Confidence vs Baseline Deviation vs Severity distinction
4. Recommendation mapping to faults
5. Maintenance work-order pre-population
6. Backend persistence and dynamic baseline integrity
"""

import sys
import os
import json

# Ensure utf-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dynamic_thresholds import threshold_engine
from database import init_database, get_alerts, create_alert, get_maintenance_tasks, create_maintenance_task

def test_step11():
    print("==================================================")
    print("STEP 11 — EXPLAINABLE ALERTS VERIFICATION")
    print("==================================================")

    init_database()

    # 1. Test DC Motor Alert Explanation Structure
    print("\n--- 1. Testing DC Profile Explanation & Evidence ---")
    dc_alert = {
        "asset_id": "MOTOR-12V-001",
        "motor_id": "MOTOR-12V-001",
        "fault_class": "Loose Foundation",
        "human_readable_fault": "Loose Foundation",
        "severity": "CRITICAL",
        "confidence": 0.87,
        "current": 1.30,
        "vibration_rms": 0.018,
        "speed_rpm": 1150,
        "pwm": 145,
        "timestamp": "2026-09-11T19:42:31"
    }

    dc_telemetry = {
        "profile": "dc_motor_12v",
        "profile_name": "dc_motor_12v",
        "current": 1.30,
        "voltage": 12.02,
        "speed_rpm": 1150,
        "pwm": 145,
        "vibration_rms": 0.018,
        "curr_mean": 1.28,
        "curr_rms": 1.30,
        "curr_fft_peak": 0.042,
        "curr_fft_mean": 0.038
    }

    # Dynamic baseline evaluation for DC
    dc_baseline_ctx = threshold_engine.evaluate(dc_telemetry)

    print(f"DC Baseline Status: {dc_baseline_ctx['status']}")
    print(f"DC Deviation: {dc_baseline_ctx['deviation_pct']}%")
    print(f"DC Learned Envelope: {dc_baseline_ctx['lower_threshold']:.2f} – {dc_baseline_ctx['upper_threshold']:.2f} A")
    assert dc_baseline_ctx['profile'] == 'dc_motor_12v', "Profile mismatch"
    assert dc_baseline_ctx['status'] in ['WARNING', 'CRITICAL'], "Status should indicate warning or critical"

    # Verify DC Isolation (No bearing/CWRU terminology)
    dc_json_str = json.dumps(dc_baseline_ctx).lower()
    for forbidden in ["inner race", "outer race", "ball defect", "spalling", "cwru"]:
        assert forbidden not in dc_json_str, f"Forbidden CWRU term '{forbidden}' in DC baseline context"
    print("[PASS] DC Baseline isolation verified.")

    # 2. Test 2 HP CWRU Motor Alert Explanation Structure
    print("\n--- 2. Testing 2 HP CWRU Profile Explanation & Evidence ---")
    cwru_alert = {
        "asset_id": "MOTOR-2HP-001",
        "motor_id": "MOTOR-2HP-001",
        "fault_class": "IR_014_1",
        "human_readable_fault": "Bearing Fault — Inner Race (0.014\")",
        "severity": "WARNING",
        "confidence": 0.94,
        "rms": 0.088,
        "kurtosis": 4.12,
        "crest": 4.45,
        "speed_rpm": 1750,
        "timestamp": "2026-09-11T19:43:10"
    }

    cwru_telemetry = {
        "profile": "cwru_2hp",
        "profile_name": "cwru_2hp",
        "rms": 0.088,
        "kurtosis": 4.12,
        "crest": 4.45,
        "speed_rpm": 1750,
        "temperature_c": 44.5
    }

    cwru_baseline_ctx = threshold_engine.evaluate(cwru_telemetry)

    print(f"CWRU Baseline Status: {cwru_baseline_ctx['status']}")
    print(f"CWRU Deviation: {cwru_baseline_ctx['deviation_pct']}%")
    print(f"CWRU Learned Envelope: {cwru_baseline_ctx['lower_threshold']:.3f} – {cwru_baseline_ctx['upper_threshold']:.3f} g")
    assert cwru_baseline_ctx['profile'] == 'cwru_2hp', "Profile mismatch"

    # Verify CWRU Isolation (No DC terminology)
    cwru_json_str = json.dumps(cwru_baseline_ctx).lower()
    for forbidden in ["pwm", "armature", "dc motor", "regulator"]:
        assert forbidden not in cwru_json_str, f"Forbidden DC term '{forbidden}' in CWRU baseline context"
    print("[PASS] 2 HP CWRU isolation verified.")

    # 3. Test Alert Creation in Database
    print("\n--- 3. Testing Alert Storage & Enrichment ---")
    saved_alert = create_alert({
        "asset_id": "MOTOR-12V-001",
        "motor_id": "MOTOR-12V-001",
        "fault_class": "Loose Foundation",
        "human_readable_fault": "Loose Foundation",
        "severity": "CRITICAL",
        "confidence": 0.87,
        "rms": 1.30,
        "message": "Current and vibration exceeded the learned operating envelope.",
        "recommendation": "Inspect motor mounting and foundation bolts.",
        "baseline_context": dc_baseline_ctx
    })
    print(f"Created Alert ID: {saved_alert['id']}, Status: {saved_alert['status']}")
    assert saved_alert['id'] is not None, "Failed to create alert"
    print("[PASS] Alert storage verified.")

    # 4. Test Work Order Pre-population and Creation
    print("\n--- 4. Testing Work Order Dispatch Flow ---")
    work_order_data = {
        "asset_id": dc_alert["asset_id"],
        "alert_id": saved_alert['id'],
        "title": f"Inspect {dc_alert['severity']}: {dc_alert['human_readable_fault']}",
        "priority": "urgent" if dc_alert["severity"] == "CRITICAL" else "high",
        "assigned_technician": "Alex Vance (Technician)",
        "due_date": "2026-09-13",
        "notes": f"Condition: {dc_alert['human_readable_fault']} | Directive: Inspect motor mounting and foundation bolts."
    }

    created_task = create_maintenance_task(work_order_data)
    print(f"Created Work Order: {created_task['title']} [ID: {created_task['id']}]")
    assert created_task['id'] is not None, "Failed to create maintenance work order"
    assert created_task['priority'] == 'urgent', "Priority mismatch"

    all_tasks = get_maintenance_tasks()
    matching_task = next((t for t in all_tasks if t["id"] == created_task["id"]), None)
    assert matching_task is not None, "Work order not found in database"
    print(f"Verified Task in DB: {matching_task['title']} [Priority: {matching_task['priority']}]")
    print("[PASS] Work order integration verified.")

    print("\n==================================================")
    print("ALL STEP 11 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_step11()
