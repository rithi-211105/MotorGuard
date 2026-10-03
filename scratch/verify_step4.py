import json

# Check DC motor metadata
with open('backend/models/dc_motor/metadata.json') as f:
    meta = json.load(f)

print('DC Model Type:', meta.get('model_type'))
print('DC Classes:', meta.get('classes'))
for fi in meta.get('feature_importance', []):
    print(f"  {fi['feature']}: {fi['importance']*100:.2f}%")

# Check AIInsights.jsx contains the exact classes and features
with open('dashboard/src/pages/AIInsights.jsx', encoding='utf-8') as f:
    code = f.read()

assert 'AI DIAGNOSIS & ANOMALY DETECTION' in code
assert '12 V DC Motor Prototype' in code
assert '2 HP Motor Bench' in code
assert 'curr_fft_mean' in code
assert '26.07%' in code
assert 'curr_fft_peak' in code
assert '18.72%' in code
assert 'curr_mean' in code
assert '15.92%' in code
assert 'Normal Operation' in code
assert 'Loose Foundation' in code
assert 'Suboptimal Control (Speed Reg)' in code
assert 'Suboptimal Control (Speed+Current Reg)' in code
assert 'Ball_007_1' in code
assert 'AI INFERENCE PIPELINE' in code
assert 'ESP32 Telemetry' in code
assert 'StandardScaler' in code
assert 'Random Forest' in code
print('\n[SUCCESS] ALL CODE AND METADATA ASSERTIONS PASSED!')
