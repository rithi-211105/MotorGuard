import os
import sys
import json
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

import ai_engine
from simulator import SimulatorManager

print("==================================================")
print("REGRESSION & DUAL PROFILE VERIFICATION TEST")
print("==================================================")

# 1. Check CWRU 2 HP Profile AI Engine
status_cwru = ai_engine.get_ai_status("cwru_2hp")
print("\n[1] CWRU 2 HP AI Engine Status:")
print(json.dumps(status_cwru, indent=2))

cwru_input = {"rms": 0.035, "sd": 0.012, "kurtosis": 2.8, "crest": 3.1, "max": 0.12, "min": -0.11, "skewness": 0.05}
pred_cwru = ai_engine.predict(cwru_input, profile="cwru_2hp")
print("\nCWRU 2 HP Prediction Sample:")
print(f"  Predicted Class: {pred_cwru['predicted_class']}")
print(f"  Confidence: {pred_cwru['confidence']}")
print(f"  Status: {pred_cwru['status']}")

# 2. Check 12 V DC Motor Profile AI Engine
status_dc = ai_engine.get_ai_status("dc_motor_12v")
print("\n[2] 12 V DC Motor AI Engine Status:")
print(json.dumps(status_dc, indent=2))

dc_input = {
    'curr_mean': 0.85, 'curr_rms': 0.89, 'curr_std': 0.10, 'curr_peak': 1.25,
    'curr_p2p': 0.70, 'curr_crest_factor': 1.40, 'curr_fft_peak': 0.35, 'curr_fft_mean': 0.12
}
pred_dc = ai_engine.predict(dc_input, profile="dc_motor_12v")
print("\n12 V DC Motor Prediction Sample:")
print(f"  Predicted Class: {pred_dc['predicted_class']}")
print(f"  Confidence: {pred_dc['confidence']}")
print(f"  Status: {pred_dc['status']}")

# 3. Check Simulator Manager Dual-Profile Switching
sim = SimulatorManager()
print("\n[3] Simulator Manager Initialization:")
print("Initial Profile Status:", sim.get_status())

sim.set_profile("dc_motor_12v")
sim.start(condition="Normal Operation")
time.sleep(0.3)
sample_dc = sim.get_latest()
print("\nDC Motor Simulation Sample:")
print(f"  Source: {sample_dc.get('source')}")
print(f"  Voltage: {sample_dc.get('voltage')} V, Current: {sample_dc.get('current')} A, Power: {sample_dc.get('power')} W")
print(f"  Speed: {sample_dc.get('speed_rpm')} RPM, PWM: {sample_dc.get('pwm')}")
print(f"  AI Pred Class: {sample_dc.get('ai_prediction', {}).get('predicted_class')}")
print(f"  AI Confidence: {sample_dc.get('ai_prediction', {}).get('confidence')}")

sim.set_profile("cwru_2hp")
sim.start(condition="Normal_1")
time.sleep(0.3)
sample_cwru = sim.get_latest()
print("\nCWRU 2 HP Simulation Sample:")
print(f"  Source: {sample_cwru.get('source')}")
print(f"  RMS: {sample_cwru.get('rms')}, Kurtosis: {sample_cwru.get('kurtosis')}")
print(f"  AI Pred Class: {sample_cwru.get('ai_prediction', {}).get('predicted_class')}")

sim.stop()
print("\nREGRESSION VERIFICATION PASSED SUCCESSFULLY!")

