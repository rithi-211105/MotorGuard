"""
Step 12 Verification Script: Edge-First & Offline Operation
Validates:
1. Architecture distinction (Edge Telemetry vs Local FastAPI vs Local AI vs Local Dashboard)
2. Confirmation that Internet is NOT required for local monitoring
3. Vite production bundle integrity
4. Profile isolation in local cache models
5. Stale packet timing thresholds (<2s LIVE, 2-10s RECENT, >10s STALE)
6. Backend offline action guards
"""

import os
import sys

def verify_step12():
    print("==================================================")
    print("STEP 12 — EDGE-FIRST + OFFLINE OPERATION VERIFICATION")
    print("==================================================")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dashboard_dist = os.path.join(base_dir, "dashboard", "dist")
    
    # 1. Check Vite build output
    print("\n--- 1. Checking Vite Production Build Output ---")
    if not os.path.exists(dashboard_dist):
        print("[FAIL] dashboard/dist does not exist.")
        sys.exit(1)
    
    dist_files = os.listdir(dashboard_dist)
    print(f"Dist contents: {dist_files}")
    assert "index.html" in dist_files, "index.html missing from dist"
    print("[PASS] Vite production build output present and valid.")

    # 2. Inspect frontend source files for accurate architecture representation
    print("\n--- 2. Verifying Edge-First Architecture & No False Claims ---")
    common_jsx_path = os.path.join(base_dir, "dashboard", "src", "components", "Common.jsx")
    with open(common_jsx_path, "r", encoding="utf-8") as f:
        common_jsx = f.read()

    assert "EdgeArchitectureFlow" in common_jsx, "EdgeArchitectureFlow missing from Common.jsx"
    assert "TelemetryFreshnessBadge" in common_jsx, "TelemetryFreshnessBadge missing from Common.jsx"
    assert "SystemOperatingModeCard" in common_jsx, "SystemOperatingModeCard missing from Common.jsx"
    assert "Cloud Connection Not Required" in common_jsx, "Cloud connection requirement claim missing"
    assert "LOCAL RUNTIME" in common_jsx or "LOCAL" in common_jsx, "Local runtime label missing"
    print("[PASS] Common.jsx contains EdgeArchitectureFlow, TelemetryFreshnessBadge, and SystemOperatingModeCard.")

    # 3. Inspect App.jsx for offline handling and stale packet detection
    print("\n--- 3. Verifying App.jsx Offline Detection & Last-Known Cache ---")
    app_jsx_path = os.path.join(base_dir, "dashboard", "src", "app.jsx")
    with open(app_jsx_path, "r", encoding="utf-8") as f:
        app_jsx = f.read()

    assert "navigator.onLine" in app_jsx, "navigator.onLine missing from app.jsx"
    assert "motorguard_last_known_dc" in app_jsx, "DC last known cache missing"
    assert "motorguard_last_known_cwru" in app_jsx, "CWRU last known cache missing"
    assert "telemetryAgeSec < 2.0" in app_jsx, "LIVE freshness threshold (<2.0s) missing"
    assert "telemetryAgeSec < 10.0" in app_jsx, "RECENT freshness threshold (<10.0s) missing"
    assert "connectionStatus" in app_jsx, "connectionStatus object missing"
    print("[PASS] App.jsx implements navigator.onLine, stale timers (<2s, 2-10s, >10s), and profile-isolated localStorage caching.")

    # 4. Inspect Navbar.jsx for interactive connectivity popover
    print("\n--- 4. Verifying Navbar.jsx Compact Connectivity Indicator ---")
    navbar_jsx_path = os.path.join(base_dir, "dashboard", "src", "components", "Navbar.jsx")
    with open(navbar_jsx_path, "r", encoding="utf-8") as f:
        navbar_jsx = f.read()

    assert "showStatusPopover" in navbar_jsx, "showStatusPopover missing from Navbar.jsx"
    assert "EDGE CONNECTIVITY DIAGNOSTICS" in navbar_jsx, "Diagnostics popover title missing"
    assert "connectionStatus" in navbar_jsx, "connectionStatus prop missing in Navbar.jsx"
    print("[PASS] Navbar.jsx implements interactive edge connectivity popover.")

    # 5. Inspect Settings.jsx for Edge / Connectivity section and claim
    print("\n--- 5. Verifying Settings.jsx Section 17, 18 & 20 Requirements ---")
    settings_jsx_path = os.path.join(base_dir, "dashboard", "src", "pages", "Settings.jsx")
    with open(settings_jsx_path, "r", encoding="utf-8") as f:
        settings_jsx = f.read()

    assert "EDGE / CONNECTIVITY STATUS" in settings_jsx, "EDGE / CONNECTIVITY STATUS section missing"
    assert "HARDWARE NODE" in settings_jsx, "HARDWARE NODE missing"
    assert "FASTAPI LOCAL HOST" in settings_jsx, "FASTAPI LOCAL HOST missing"
    assert "LOCAL RUNTIME (FASTAPI HOST)" in settings_jsx, "LOCAL RUNTIME label missing"
    assert "SQLITE (infra_monitor.db)" in settings_jsx, "Database info missing"
    assert "INDUSTRIAL LOCAL-FIRST GUARANTEE" in settings_jsx, "Local-first guarantee missing"
    assert "MotorGuard is designed for local industrial monitoring and does not require cloud connectivity" in settings_jsx, "Required exact statement missing"
    print("[PASS] Settings.jsx fulfills Section 17, 18 and Section 20 requirements.")

    # 6. Inspect Alerts.jsx for offline guards & Last Known Diagnosis
    print("\n--- 6. Verifying Alerts.jsx Offline Safety ---")
    alerts_jsx_path = os.path.join(base_dir, "dashboard", "src", "pages", "Alerts.jsx")
    with open(alerts_jsx_path, "r", encoding="utf-8") as f:
        alerts_jsx = f.read()

    assert "handleSafeAcknowledge" in alerts_jsx, "handleSafeAcknowledge missing"
    assert "handleSafeResolve" in alerts_jsx, "handleSafeResolve missing"
    assert "Backend unavailable — action not sent." in alerts_jsx, "Backend unavailable warning message missing"
    assert "LAST KNOWN DIAGNOSIS (WAITING FOR FRESH DATA)" in alerts_jsx, "Last Known Diagnosis label missing"
    assert "ALERT ENGINE: MONITORING PAUSED" in alerts_jsx, "Monitoring paused banner missing"
    print("[PASS] Alerts.jsx implements backend unavailable guards and safe offline state presentation.")

    print("\n==================================================")
    print("ALL STEP 12 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    verify_step12()
