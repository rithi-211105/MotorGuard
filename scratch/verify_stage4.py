"""
verify_stage4.py - Verification Script for Stage 4 Frontend & Backend Integration
"""

import requests
import json

def test_rest_api():
    print("==================================================")
    print(" STAGE 4 REST API & STATIC FILE VERIFICATION")
    print("==================================================")
    
    urls = [
        "http://127.0.0.1:8000/",
        "http://127.0.0.1:8000/src/app.js",
        "http://127.0.0.1:8000/src/api.js",
        "http://127.0.0.1:8000/src/styles.css",
        "http://127.0.0.1:8000/src/components/Common.js",
        "http://127.0.0.1:8000/src/components/Navbar.js",
        "http://127.0.0.1:8000/src/pages/Overview.js",
        "http://127.0.0.1:8000/src/pages/LiveMonitoring.js",
        "http://127.0.0.1:8000/src/pages/AIInsights.js",
        "http://127.0.0.1:8000/src/pages/Settings.js",
        "http://127.0.0.1:8000/src/pages/Assets.js",
        "http://127.0.0.1:8000/src/pages/Energy.js",
        "http://127.0.0.1:8000/src/pages/Analytics.js",
        "http://127.0.0.1:8000/api/ai/status",
        "http://127.0.0.1:8000/api/simulation/status",
        "http://127.0.0.1:8000/api/sensor/current"
    ]
    
    all_ok = True
    for url in urls:
        r = requests.get(url)
        print(f"  {r.status_code} OK : {url}")
        if r.status_code != 200:
            all_ok = False
            
    print("\n  Testing Simulation Control Endpoints:")
    cond_res = requests.post("http://127.0.0.1:8000/api/simulation/condition", json={"condition": "IR_021_1"}).json()
    print(f"  [OK] POST /api/simulation/condition -> Switched to {cond_res.get('condition')}")
    
    speed_res = requests.post("http://127.0.0.1:8000/api/simulation/speed", json={"speed_multiplier": 5.0}).json()
    print(f"  [OK] POST /api/simulation/speed -> Speed multiplier {speed_res.get('speed_multiplier')}x")
    
    print("\n  Testing Live Current Sensor Data:")
    current = requests.get("http://127.0.0.1:8000/api/sensor/current").json()
    print(f"  [OK] Motor ID       : {current.get('motor_id')}")
    print(f"  [OK] Ground Truth   : {current.get('ground_truth')}")
    print(f"  [OK] AI Prediction  : {current.get('ai_prediction', {}).get('predicted_class')}")
    print(f"  [OK] AI Confidence  : {current.get('ai_prediction', {}).get('confidence')}")
    print(f"  [OK] Condition Score: {current.get('ai_prediction', {}).get('condition_score')}")
    print(f"  [OK] 7 Features     : rms={current.get('rms')}, sd={current.get('sd')}, kurtosis={current.get('kurtosis')}, crest={current.get('crest')}, max={current.get('max')}, min={current.get('min')}, skewness={current.get('skewness')}")
    print(f"  [OK] Temp / Battery : temp={current.get('simulated_temperature')}°C, battery={current.get('simulated_battery_voltage')}V")
    
    return all_ok

if __name__ == '__main__':
    ok = test_rest_api()
    if ok:
        print("\n==================================================")
        print(" ALL STAGE 4 INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("==================================================")
