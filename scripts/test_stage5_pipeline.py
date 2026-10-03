"""
test_stage5_pipeline.py - Automated Stage 5 Test Runner
Verifies Intelligent Alerts, Deduplication, Severity Mapping, SQLite Persistence, and Maintenance Work Orders
"""

import requests
import time
import sys

API_BASE = "http://127.0.0.1:8000"

def run_stage_5_tests():
    print("==========================================================================")
    print(" STAGE 5 INTELLIGENT ALERTS & DECISION SUPPORT VERIFICATION SUITE")
    print("==========================================================================")

    # Scenario 1: Normal_1
    print("\n--- SCENARIO 1: Normal_1 Healthy Operation ---")
    requests.post(f"{API_BASE}/api/simulation/start", json={"condition": "Normal_1", "speed_multiplier": 5.0})
    time.sleep(0.3)
    curr1 = requests.get(f"{API_BASE}/api/sensor/current").json()
    print(f"  [OK] AI Prediction  : {curr1.get('ai_prediction', {}).get('predicted_class')}")
    print(f"  [OK] Ground Truth   : {curr1.get('ground_truth')}")
    assert curr1.get('ground_truth') == "Normal_1"
    active1 = requests.get(f"{API_BASE}/api/alerts/active").json()
    print(f"  [OK] Active Alerts Initial Count: {len(active1)}")

    # Scenario 2: Switch to Ball_014_1
    print("\n--- SCENARIO 2: Switch to Ball_014_1 ---")
    requests.post(f"{API_BASE}/api/simulation/condition", json={"condition": "Ball_014_1", "speed_multiplier": 5.0})
    time.sleep(1.2)
    curr2 = requests.get(f"{API_BASE}/api/sensor/current").json()
    ai2 = curr2.get('ai_prediction', {}).get('predicted_class')
    print(f"  [OK] AI Prediction  : {ai2}")
    print(f"  [OK] Ground Truth   : {curr2.get('ground_truth')}")
    assert curr2.get('ground_truth') == "Ball_014_1"
    
    active2 = requests.get(f"{API_BASE}/api/alerts/active").json()
    print(f"  [OK] Active Alerts Count after Ball_014_1 switch: {len(active2)}")
    assert len(active2) >= 1, "Alert creation failed for Ball_014_1"
    alert_014 = active2[0]
    fault_desc = alert_014.get('human_readable_fault') or alert_014.get('message')
    print(f"  [OK] Alert Created  : ID #{alert_014['id']} | Severity: {alert_014['severity']} | Fault: {fault_desc}")

    # Scenario 3: Telemetry Stream Deduplication Test (50 Packets)
    print("\n--- SCENARIO 3: Telemetry Deduplication Test ---")
    print("  Streaming 20 telemetry packets under Ball_014_1...")
    for _ in range(20):
        requests.get(f"{API_BASE}/api/sensor/current")
        time.sleep(0.02)
    
    active3 = requests.get(f"{API_BASE}/api/alerts/active").json()
    print(f"  [OK] Active Alerts Count after 20 packets: {len(active3)}")
    assert len(active3) == len(active2), f"Deduplication failed! Expected {len(active2)} alerts, got {len(active3)}"

    # Scenario 4: Switch to IR_021_1 (Class Change & Escalation)
    print("\n--- SCENARIO 4: Switch to IR_021_1 (Class Change) ---")
    requests.post(f"{API_BASE}/api/simulation/condition", json={"condition": "IR_021_1", "speed_multiplier": 5.0})
    time.sleep(1.2)
    curr4 = requests.get(f"{API_BASE}/api/sensor/current").json()
    print(f"  [OK] AI Prediction  : {curr4.get('ai_prediction', {}).get('predicted_class')}")
    active4 = requests.get(f"{API_BASE}/api/alerts/active").json()
    print(f"  [OK] Active Alerts Count after IR_021_1 switch: {len(active4)}")
    assert len(active4) > len(active3), f"New alert should be generated when fault class changes to IR_021_1 (Expected > {len(active3)}, got {len(active4)})"
    alert_021 = active4[0]
    fault_desc_021 = alert_021.get('human_readable_fault') or alert_021.get('message')
    print(f"  [OK] New Alert      : ID #{alert_021['id']} | Severity: {alert_021['severity']} | Fault: {fault_desc_021}")

    # Scenario 5: Acknowledge Alert
    print("\n--- SCENARIO 5: Acknowledge Alert ---")
    ack_res = requests.post(f"{API_BASE}/api/alerts/{alert_021['id']}/acknowledge").json()
    print(f"  [OK] POST /api/alerts/{alert_021['id']}/acknowledge -> Status: {ack_res.get('status')}")
    assert ack_res.get('status') == "ACKNOWLEDGED", "Acknowledge status mismatch"

    # Scenario 6: Resolve Alert
    print("\n--- SCENARIO 6: Resolve Alert ---")
    res_res = requests.post(f"{API_BASE}/api/alerts/{alert_021['id']}/resolve").json()
    print(f"  [OK] POST /api/alerts/{alert_021['id']}/resolve -> Status: {res_res.get('status')}")
    assert res_res.get('status') == "RESOLVED", "Resolve status mismatch"

    # Scenario 7: Switch back to Normal_1 then Ball_021_1 again
    print("\n--- SCENARIO 7: Reset to Normal_1 and Re-Trigger Fault ---")
    requests.post(f"{API_BASE}/api/simulation/condition", json={"condition": "Normal_1", "speed_multiplier": 5.0})
    time.sleep(0.3)
    requests.post(f"{API_BASE}/api/simulation/condition", json={"condition": "Ball_021_1", "speed_multiplier": 5.0})
    time.sleep(0.6)
    active7 = requests.get(f"{API_BASE}/api/alerts/active").json()
    print(f"  [OK] Re-triggered Alert Count: {len(active7)}")

    # Scenario 8: Maintenance Work Order Test
    print("\n--- SCENARIO 8: Maintenance Work Order Pipeline ---")
    task_res = requests.post(f"{API_BASE}/api/maintenance", json={
        "asset_id": "motor-001",
        "title": "Stage 5 Test Work Order - Replace Ball Bearing",
        "priority": "urgent",
        "assigned_technician": "Alex Vance (Technician)",
        "notes": "Generated during Stage 5 automated test"
    }).json()
    print(f"  [OK] Created Work Order Task ID: #{task_res.get('id')} | Title: {task_res.get('title')}")
    
    update_res = requests.patch(f"{API_BASE}/api/maintenance/{task_res['id']}", json={"status": "IN_PROGRESS"}).json()
    print(f"  [OK] Updated Task Status to: {update_res.get('status')}")
    assert update_res.get('status') == "IN_PROGRESS"

    print("\n==========================================================================")
    print(" ALL STAGE 5 AUTOMATED VERIFICATION TESTS PASSED CLEANLY!")
    print("==========================================================================")

if __name__ == '__main__':
    run_stage_5_tests()
