import sys
import os

# Adjust path to import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from dynamic_thresholds import DynamicThresholdEngine
from database import init_database, save_dynamic_baseline, load_dynamic_baseline

print("=== 1. TEST DATABASE INITIALIZATION & DYNAMIC BASELINES TABLE ===")
init_database()
print("[PASS] init_database executed successfully.")

print("\n=== 2. TEST DYNAMIC THRESHOLD ENGINE INITIALIZATION & SEEDING ===")
engine = DynamicThresholdEngine()
dc_base = engine.get_profile_baseline('dc_motor_12v')
cwru_base = engine.get_profile_baseline('cwru_2hp')

print(f"DC Baseline: status={dc_base['status']}, samples={dc_base['samples']}, mean={dc_base['mean']} {dc_base['unit']}")
print(f"  Range: {dc_base['lower_threshold']} – {dc_base['upper_threshold']} {dc_base['unit']}")
print(f"CWRU Baseline: status={cwru_base['status']}, samples={cwru_base['samples']}, mean={cwru_base['mean']} {cwru_base['unit']}")
print(f"  Range: {cwru_base['lower_threshold']} – {cwru_base['upper_threshold']} {cwru_base['unit']}")

assert dc_base['profile'] == 'dc_motor_12v', "DC profile mismatch"
assert cwru_base['profile'] == 'cwru_2hp', "CWRU profile mismatch"
assert dc_base['unit'] == 'A', "DC unit should be A"
assert cwru_base['unit'] == 'g', "CWRU unit should be g"
print("[PASS] Profiles initialized with honest data and strict separation.")

print("\n=== 3. TEST CONTEXT-AWARE DEVIATION EVALUATION (12 V DC) ===")
# Case A: Nominal DC sample at nominal PWM 200
sample_nominal_dc = {
    "profile_name": "dc_motor_12v",
    "voltage": 12.02,
    "current": 0.94,
    "speed_rpm": 1750,
    "pwm": 200,
    "fault_class": "Normal Operation"
}
eval_nominal = engine.evaluate(sample_nominal_dc)
print(f"Nominal DC Evaluation: status={eval_nominal['status']}, live={eval_nominal['live_value']} A, mean={eval_nominal['baseline_mean']} A, dev={eval_nominal['deviation_pct']}%")
assert eval_nominal['status'] == 'NORMAL', f"Expected NORMAL, got {eval_nominal['status']}"

# Case B: Elevated current (1.30 A) at low PWM (145) - abnormal loading
sample_warn_dc = {
    "profile_name": "dc_motor_12v",
    "voltage": 11.8,
    "current": 1.30,
    "speed_rpm": 1150,
    "pwm": 145,
    "fault_class": "Loose Foundation"
}
eval_warn = engine.evaluate(sample_warn_dc)
print(f"Over-envelope DC Evaluation: status={eval_warn['status']}, live={eval_warn['live_value']} A, mean={eval_warn['baseline_mean']} A, dev={eval_warn['deviation_pct']}%")
print(f"  Directive: {eval_warn['directive']}")
assert eval_warn['status'] in ['WARNING', 'CRITICAL'], f"Expected WARNING/CRITICAL, got {eval_warn['status']}"
assert eval_warn['deviation_pct'] > 20.0, f"Expected deviation > 20%, got {eval_warn['deviation_pct']}%"

print("\n=== 4. TEST CONTEXT-AWARE DEVIATION EVALUATION (2 HP CWRU) ===")
# Case C: Nominal CWRU vibration sample
sample_nominal_cwru = {
    "profile_name": "cwru_2hp",
    "rms": 0.075,
    "speed_rpm": 1797,
    "temperature_c": 28.5,
    "fault_class": "Normal_1"
}
eval_cwru_nom = engine.evaluate(sample_nominal_cwru)
print(f"Nominal CWRU Evaluation: status={eval_cwru_nom['status']}, live={eval_cwru_nom['live_value']} g, mean={eval_cwru_nom['baseline_mean']} g, dev={eval_cwru_nom['deviation_pct']}%")
assert eval_cwru_nom['status'] == 'NORMAL', f"Expected NORMAL, got {eval_cwru_nom['status']}"

# Case D: Severe bearing vibration sample (e.g. 0.35 g)
sample_crit_cwru = {
    "profile_name": "cwru_2hp",
    "rms": 0.350,
    "speed_rpm": 1750,
    "fault_class": "IR_021_1"
}
eval_cwru_crit = engine.evaluate(sample_crit_cwru)
print(f"Fault CWRU Evaluation: status={eval_cwru_crit['status']}, live={eval_cwru_crit['live_value']} g, mean={eval_cwru_crit['baseline_mean']} g, dev={eval_cwru_crit['deviation_pct']}%")
print(f"  Directive: {eval_cwru_crit['directive']}")
assert eval_cwru_crit['status'] == 'CRITICAL', f"Expected CRITICAL, got {eval_cwru_crit['status']}"

print("\n=== 5. TEST SQLITE PERSISTENCE ACROSS SESSIONS ===")
save_dynamic_baseline("dc_motor_12v", "MOTOR-12V-001", {"sample_count": 145, "status": "READY", "persisted_marker": True})
loaded = load_dynamic_baseline("dc_motor_12v")
assert loaded is not None and loaded.get("persisted_marker") is True, "Failed restoring dynamic baseline from SQLite"
print(f"[PASS] Dynamic baseline persistence verified in SQLite: sample_count={loaded.get('sample_count')}")

print("\n=== ALL STEP 10 BACKEND TESTS PASSED ===")
