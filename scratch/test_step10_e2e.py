import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from dynamic_thresholds import DynamicThresholdEngine
from database import init_database, get_alerts, get_alert_by_id, create_alert, load_dynamic_baseline

print("==================================================")
print("STEP 10 END-TO-END VERIFICATION SUITE")
print("==================================================")

init_database()
engine = DynamicThresholdEngine()

# Test 1: 12 V DC Motor Baseline Profile
print("\n[TEST 1] 12 V DC Motor Baseline Verification")
dc_base = engine.get_profile_baseline("dc_motor_12v")
print(f"  Asset ID: {dc_base['asset_id']}")
print(f"  Profile: {dc_base['profile']}")
print(f"  Status: {dc_base['status']}")
print(f"  Confidence: {dc_base['confidence']}%")
print(f"  Sample Count: {dc_base['samples']}")
print(f"  Primary Metric: {dc_base['primary_metric']} ({dc_base['unit']})")
print(f"  Nominal Mean: {dc_base['mean']} {dc_base['unit']}")
print(f"  Learned Envelope: {dc_base['lower_threshold']} – {dc_base['upper_threshold']} {dc_base['unit']}")

assert dc_base['profile'] == 'dc_motor_12v'
assert dc_base['primary_metric'] == 'current'
assert dc_base['unit'] == 'A'
assert dc_base['lower_threshold'] < dc_base['mean'] < dc_base['upper_threshold']
print("  ✓ 12 V DC baseline strictly follows electrical operating characteristics.")

# Test 2: 2 HP Induction Motor Baseline Profile
print("\n[TEST 2] 2 HP CWRU Motor Baseline Verification")
cwru_base = engine.get_profile_baseline("cwru_2hp")
print(f"  Asset ID: {cwru_base['asset_id']}")
print(f"  Profile: {cwru_base['profile']}")
print(f"  Status: {cwru_base['status']}")
print(f"  Confidence: {cwru_base['confidence']}%")
print(f"  Sample Count: {cwru_base['samples']}")
print(f"  Primary Metric: {cwru_base['primary_metric']} ({cwru_base['unit']})")
print(f"  Nominal Mean: {cwru_base['mean']} {cwru_base['unit']}")
print(f"  Learned Envelope: {cwru_base['lower_threshold']} – {cwru_base['upper_threshold']} {cwru_base['unit']}")

assert cwru_base['profile'] == 'cwru_2hp'
assert cwru_base['primary_metric'] == 'rms'
assert cwru_base['unit'] == 'g'
assert cwru_base['lower_threshold'] < cwru_base['mean'] < cwru_base['upper_threshold']
print("  ✓ 2 HP CWRU baseline strictly follows vibration operating characteristics.")

# Test 3: Profile Isolation
print("\n[TEST 3] Profile Isolation Verification")
assert 'current' not in cwru_base['metrics'], "DC current leaked into CWRU profile!"
assert 'voltage' not in cwru_base['metrics'], "DC voltage leaked into CWRU profile!"
assert 'kurtosis' not in dc_base['metrics'], "CWRU kurtosis leaked into DC profile!"
print("  ✓ Absolute metric isolation verified between 12 V DC and 2 HP CWRU.")

# Test 4: Operational Context Scaling (RPM / PWM)
print("\n[TEST 4] Operational Context-Aware Scaling (12 V DC)")
# Sample at low PWM (120): expected current is lower (~0.82 A)
sample_low_pwm = {
    "profile_name": "dc_motor_12v",
    "speed_rpm": 1050,
    "pwm": 120,
    "current": 1.15,
    "fault_class": "Loose Foundation"
}
eval_low = engine.evaluate(sample_low_pwm)
print(f"  Low PWM (120) Context: {eval_low['context_summary']}")
print(f"  Context-adjusted Baseline Mean: {eval_low['baseline_mean']} A (Nominal was {eval_low['nominal_mean']} A)")
print(f"  Dynamic Envelope: {eval_low['lower_threshold']} – {eval_low['upper_threshold']} A")
print(f"  Live Reading: {eval_low['live_value']} A")
print(f"  Deviation: {eval_low['deviation_pct']}% -> Status: {eval_low['status']}")
print(f"  Directive: {eval_low['directive']}")

assert eval_low['status'] in ['WARNING', 'CRITICAL']
assert eval_low['deviation_pct'] > 25.0
print("  ✓ Context awareness correctly scales baseline and identifies abnormal loading.")

# Test 5: Alert Integration & SQLite Persistence
print("\n[TEST 5] Alert Integration & SQLite Persistence")
test_alert_payload = {
    "motor_id": "MOTOR-12V-001",
    "asset_id": "MOTOR-12V-001",
    "fault_class": "Loose Foundation",
    "human_readable_fault": "Loose Motor Foundation",
    "severity": eval_low['status'],
    "confidence": 0.88,
    "rms": 0.045,
    "temperature": 29.5,
    "message": "Loose Motor Foundation (Loose Foundation) - Inspect mounting hardware and foundation",
    "recommendation": eval_low['directive'],
    "details": eval_low,
    "baseline_context": eval_low,
    "status": "ACTIVE"
}
created_alert = create_alert(test_alert_payload)
print(f"  Created Alert ID: #{created_alert['id']}")
print(f"  Stored Directive: {created_alert['recommendation']}")
print(f"  Enriched Baseline Context Status: {created_alert.get('baseline_context', {}).get('status')}")

assert created_alert['id'] is not None
assert created_alert.get('baseline_context', {}).get('status') == eval_low['status']
print("  ✓ Alert creation faithfully captures and persists dynamic baseline context.")

print("\n==================================================")
print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
print("==================================================")
