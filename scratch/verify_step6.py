# verify_step6.py - Automated verification script for Step 6: Analytics & Energy Redesign

with open('dashboard/src/pages/Analytics.jsx', encoding='utf-8') as f:
    analytics_code = f.read()

# Assertions for Analytics Header
assert 'ANALYTICS & PERFORMANCE' in analytics_code
assert 'Historical motor performance and condition trends' in analytics_code
assert '12 V DC Motor Prototype' in analytics_code
assert '2 HP Motor Bench' in analytics_code

# Assertions for Analytics KPIs & Charts
assert 'HEALTH SCORE' in analytics_code
assert 'AVERAGE CURRENT' in analytics_code
assert 'AVERAGE SPEED' in analytics_code
assert 'ANOMALY EVENTS' in analytics_code
assert 'LiveChart' in analytics_code
assert 'PRIMARY CURRENT WAVEFORM TREND' in analytics_code
assert 'PRIMARY VIBRATION RMS TREND' in analytics_code

# Assertions for Analytics Condition Distribution & Baseline Comparison
assert 'CONDITION OCCURRENCE DISTRIBUTION' in analytics_code
assert 'Normal Operation' in analytics_code
assert 'Loose Foundation' in analytics_code
assert 'Suboptimal Control (Speed Reg)' in analytics_code
assert 'Suboptimal Control (Speed+Current Reg)' in analytics_code
assert 'CURRENT VS BASELINE COMPARISON' in analytics_code
assert 'NO BASELINE COMPARISON AVAILABLE' in analytics_code

with open('dashboard/src/pages/Energy.jsx', encoding='utf-8') as f:
    energy_code = f.read()

# Assertions for Energy Header & KPIs
assert 'ENERGY & ELECTRICAL PERFORMANCE' in energy_code
assert 'Real-time electrical consumption and operating trends' in energy_code
assert 'SUPPLY VOLTAGE' in energy_code
assert 'MOTOR CURRENT' in energy_code
assert 'ELECTRICAL POWER' in energy_code
assert 'ENERGY CONSUMED' in energy_code
assert 'BATTERY VOLTAGE' in energy_code
assert 'CHARGE LEVEL' in energy_code
assert 'HARVESTING SOURCE' in energy_code

# Assertions for Energy Primary & Grid Charts
assert 'POWER CONSUMPTION TREND' in energy_code
assert 'BATTERY VOLTAGE & HARVESTING TREND' in energy_code
assert 'BUS VOLTAGE (V)' in energy_code
assert 'ACTIVE POWER (W)' in energy_code
assert 'PWM REGULATION' in energy_code

# Assertions for Energy Hardware Specifications & Load
assert 'OPERATING LOAD FACTOR' in energy_code
assert 'ELECTRICAL SENSING SPECIFICATIONS' in energy_code
assert 'ESP32-S3 + INA219' in energy_code

print('[SUCCESS] All Step 6 Analytics & Energy code assertions passed cleanly!')
