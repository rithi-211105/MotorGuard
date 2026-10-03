"""
test_esp32_hardware.py - Hardware Integration Test Runner
Simulates real ESP32 microcontroller HTTP POST telemetry streaming to Node.js backend.
"""

import sys
import time
import requests
import json
import random

SERVER_URL = "http://localhost:8000/api/telemetry/esp32"

def run_esp32_hardware_simulation(condition="healthy", duration_sec=60):
    print("==================================================")
    print(" ESP32 HARDWARE TELEMETRY INGESTION TEST RUNNER")
    print("==================================================")
    print(f"Target Server : {SERVER_URL}")
    print(f"Test Condition: {condition.upper()}")
    print(f"Duration      : {duration_sec} seconds")
    print("--------------------------------------------------")

    start_time = time.time()
    count = 0

    while time.time() - start_time < duration_sec:
        count += 1
        
        if condition == "healthy":
            accel_rms = 0.0312 + random.uniform(-0.003, 0.003)
            accel_peak = 0.0485 + random.uniform(-0.004, 0.004)
            temp_c = 28.4 + random.uniform(-0.3, 0.3)
            battery_v = 3.94 + random.uniform(-0.02, 0.02)
            kurtosis = 2.12 + random.uniform(-0.1, 0.1)
        elif condition == "fault_bearing":
            accel_rms = 0.185 + random.uniform(-0.01, 0.02)
            accel_peak = 0.320 + random.uniform(-0.02, 0.03)
            temp_c = 44.5 + random.uniform(-0.8, 0.8)
            battery_v = 3.88 + random.uniform(-0.03, 0.02)
            kurtosis = 6.85 + random.uniform(-0.3, 0.5)
        else: # fault_imbalance
            accel_rms = 0.145 + random.uniform(-0.01, 0.01)
            accel_peak = 0.210 + random.uniform(-0.01, 0.02)
            temp_c = 36.2 + random.uniform(-0.5, 0.5)
            battery_v = 3.91 + random.uniform(-0.02, 0.02)
            kurtosis = 3.45 + random.uniform(-0.2, 0.2)

        payload = {
            "device_id": "ESP32-MOTOR-001",
            "accel_rms": round(accel_rms, 4),
            "accel_peak": round(accel_peak, 4),
            "temperature_c": round(temp_c, 1),
            "battery_v": round(battery_v, 2),
            "kurtosis": round(kurtosis, 2),
            "skewness": 0.02,
            "timestamp": int(time.time() * 1000)
        }

        try:
            res = requests.post(SERVER_URL, json=payload, timeout=2.0)
            if res.status_code == 200:
                resp_json = res.json()
                ai = resp_json.get("ai_ml_prediction", {})
                mode = resp_json.get("mode", "LIVE HARDWARE")
                print(f"[{count:03d}] [HTTP {res.status_code}] Mode: {mode} | Class: {ai.get('predicted_class')} | Anomaly Score: {ai.get('anomaly_score')} | Status: {ai.get('status')}")
            else:
                print(f"[{count:03d}] [HTTP {res.status_code}] Post Error: {res.text}")
        except Exception as e:
            print(f"[{count:03d}] Connection Error: {e}")

        time.sleep(0.5) # Send at 2 Hz cadence

    print("--------------------------------------------------")
    print(f"Test completed. Sent {count} ESP32 hardware telemetry packets.")

if __name__ == "__main__":
    cond = sys.argv[1] if len(sys.argv) > 1 else "healthy"
    dur = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    run_esp32_hardware_simulation(cond, dur)
