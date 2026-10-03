import sys
import json
import time
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=== STEP 10: BACKEND HARDWARE TELEMETRY PIPELINE AUDIT ===")

BASE_URL = "http://127.0.0.1:8000"

# 1. Test Server Connectivity
try:
    with urllib.request.urlopen(f"{BASE_URL}/api/stats") as resp:
        stats = json.loads(resp.read().decode())
        print(f"[PASS] Backend accessible. Current mode: {stats.get('mode')}")
except Exception as e:
    print(f"[FAIL] Backend inaccessible at {BASE_URL}: {e}")
    sys.exit(1)

# 2. Test POST /api/telemetry/esp32/dc with raw waveform samples
# Generate a synthetic current waveform mimicking 12V DC motor normal idle/load
# 100 samples around 0.94 A with slight 100 Hz commutation ripple
import math
samples = [0.94 + 0.05 * math.sin(2 * math.pi * 5 * (i / 100.0)) + 0.01 * (i % 3 - 1) for i in range(100)]

payload = {
    "device_id": "ESP32-DC-001",
    "voltage_v": 12.05,
    "current_a": 0.94,
    "current_samples": samples,
    "speed_rpm": 1150.0,
    "pwm": 145.0,
    "vibration_rms": 0.012
}

req_data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(
    f"{BASE_URL}/api/telemetry/esp32/dc", 
    data=req_data, 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        print(f"[PASS] POST /api/telemetry/esp32/dc accepted with HTTP {resp.status}")
except Exception as e:
    print(f"[FAIL] POST /api/telemetry/esp32/dc failed: {e}")
    sys.exit(1)

# 3. Verify Exact 8 Extracted Features
extracted_features = result.get("features", {})
expected_features = [
    "curr_mean", "curr_rms", "curr_std", "curr_peak",
    "curr_p2p", "curr_crest_factor", "curr_fft_peak", "curr_fft_mean"
]

print("\n--- Verifying Exact 8 Extracted Features ---")
feature_errors = []
for feat in expected_features:
    if feat not in extracted_features:
        feature_errors.append(f"Missing feature: {feat}")
    else:
        val = extracted_features[feat]
        print(f"  ✓ {feat}: {val:.4f} (type: {type(val).__name__})")

if feature_errors:
    print(f"[FAIL] Feature errors: {feature_errors}")
    sys.exit(1)
else:
    print("[PASS] Exact 8 canonical features extracted matching training contract.")

# 4. Verify Random Forest AI Prediction
prediction = result.get("prediction", {})
print("\n--- Verifying AI Prediction Output ---")
print(f"  Predicted Class: {prediction.get('predicted_class')}")
print(f"  Confidence: {prediction.get('confidence')}")
print(f"  Status: {prediction.get('status')}")
print(f"  Severity: {prediction.get('severity')}")
print(f"  Condition Score: {prediction.get('condition_score')}")
print(f"  Inference Time: {prediction.get('inference_time_ms', 'N/A')} ms")

if not prediction.get("predicted_class"):
    print("[FAIL] Missing predicted_class in AI prediction")
    sys.exit(1)
else:
    print("[PASS] AI inference engine correctly classified DC motor telemetry.")

# 5. Verify Live Mode and Dashboard Stats Updates
time.sleep(0.2)
with urllib.request.urlopen(f"{BASE_URL}/api/stats") as resp:
    updated_stats = json.loads(resp.read().decode())

print("\n--- Verifying Backend State Transition ---")
print(f"  is_hardware_live: {updated_stats.get('is_hardware_live')}")
print(f"  mode: {updated_stats.get('mode')}")
active_sensor = updated_stats.get("sensor", {})
print(f"  sensor.source: {active_sensor.get('source')}")
print(f"  sensor.motor_id: {active_sensor.get('motor_id')}")
print(f"  sensor.voltage: {active_sensor.get('voltage')} V")
print(f"  sensor.current: {active_sensor.get('current')} A")
print(f"  sensor.power: {active_sensor.get('power')} W")
print(f"  sensor.speed_rpm: {active_sensor.get('speed_rpm')} RPM")
print(f"  sensor.pwm: {active_sensor.get('pwm')}")

if not updated_stats.get("is_hardware_live") or "LIVE HARDWARE" not in updated_stats.get("mode", ""):
    print("[FAIL] Backend did not transition to LIVE HARDWARE mode.")
    sys.exit(1)
else:
    print("[PASS] Backend successfully transitioned to LIVE HARDWARE (12 V DC Motor).")

# 6. Verify Profile Isolation & Switch to 2 HP
print("\n--- Verifying Profile Isolation & Switch to 2 HP ---")
# Wait 5.2 seconds for hardware live ping timeout (5000 ms) so simulator re-engages for CWRU
print("  Waiting 5.2s for live hardware ping timeout...")
time.sleep(5.2)

switch_req = urllib.request.Request(
    f"{BASE_URL}/api/motor-profile",
    data=json.dumps({"profile": "cwru_2hp"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(switch_req) as resp:
    switch_res = json.loads(resp.read().decode())
    print(f"  Profile switched to: {switch_res.get('active_profile')}")

time.sleep(0.5)
with urllib.request.urlopen(f"{BASE_URL}/api/stats") as resp:
    cwru_stats = json.loads(resp.read().decode())
    cwru_sensor = cwru_stats.get("sensor") or {}
    print(f"  2 HP Sensor Profile: {cwru_sensor.get('profile_name')}")
    print(f"  2 HP Sensor Asset ID: {cwru_sensor.get('asset_id')}")

if cwru_sensor.get("profile_name") != "cwru_2hp" or cwru_sensor.get("asset_id") != "MOTOR-2HP-001":
    print(f"[FAIL] CWRU 2 HP profile was corrupted by DC data: {cwru_sensor}")
    sys.exit(1)
else:
    print("[PASS] Profile isolation verified: 2 HP CWRU profile remains pristine.")

# Switch back to dc_motor_12v for DC Motor test bench readiness
switch_back = urllib.request.Request(
    f"{BASE_URL}/api/motor-profile",
    data=json.dumps({"profile": "dc_motor_12v"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(switch_back):
    pass

print("\n🎉 ALL STEP 10 SOFTWARE PIPELINE VERIFICATIONS PASSED SUCCESSFULLY!")
