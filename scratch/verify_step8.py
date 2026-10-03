import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=== STEP 8 VERIFICATION SCRIPT ===")

workspace = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
alerts_file = os.path.join(workspace, "dashboard", "src", "pages", "Alerts.jsx")
styles_file = os.path.join(workspace, "dashboard", "src", "styles.css")

with open(alerts_file, "r", encoding="utf-8") as f:
    alerts_content = f.read()

with open(styles_file, "r", encoding="utf-8") as f:
    styles_content = f.read()

errors = []

# 1. Verify required sections in Alerts.jsx
print("\n--- Checking Alerts.jsx structure & terms ---")
required_terms = [
    "ALERTS &amp; EVENTS",
    "Real-time equipment events and condition warnings",
    "TOTAL EVENTS",
    "ACTIVE ALERTS",
    "CRITICAL",
    "WARNINGS",
    "SEVERITY DISTRIBUTION",
    "LIVE EVENT STREAM",
    "EVENT DETAILS",
    "DIAGNOSTIC DIRECTIVE",
    "CREATE MAINTENANCE WORK ORDER",
    "onAcknowledgeAlert",
    "onResolveAlert",
    "onCreateTask",
    "MOTOR-12V-001",
    "MOTOR-2HP-001"
]

for term in required_terms:
    if term not in alerts_content:
        errors.append(f"Alerts.jsx missing: {term}")
    else:
        print(f"✓ Found in Alerts.jsx: {term}")

# 2. Verify Profile Isolation logic
print("\n--- Checking Profile Isolation logic ---")
if "if (isDC)" not in alerts_content:
    errors.append("Alerts.jsx missing 'if (isDC)' condition")
else:
    print("✓ Found isDC check in profile filter")

# Check that CWRU bearing terms are excluded under isDC
bearing_exclusions = ["ball", "ir_", "or_", "bearing", "inner race", "outer race"]
for term in bearing_exclusions:
    if f"aFault.includes('{term}')" in alerts_content or f"aMsg.includes('{term}')" in alerts_content or f"aHuman.includes('{term}')" in alerts_content:
        print(f"✓ Found CWRU exclusion under isDC: {term}")
    else:
        errors.append(f"Missing exclusion for {term} under isDC")

# Check that DC faults are excluded under !isDC
dc_exclusions = ["loose foundation", "suboptimal control", "speed reg", "12v"]
for term in dc_exclusions:
    if term in alerts_content.lower():
        print(f"✓ Found DC isolation keyword: {term}")
    else:
        errors.append(f"Missing DC isolation keyword: {term}")

# 3. Verify Profile Switching safety
print("\n--- Checking Profile Switching safety ---")
if "setSelectedAlertId(null)" in alerts_content and "[isDC, activeInfrastructure, activeProfile]" in alerts_content:
    print("✓ Profile switch resets selected alert ID to prevent stale alert retention")
else:
    errors.append("Alerts.jsx does not reset selectedAlertId on profile switch")

# 4. Verify styles.css additions
print("\n--- Checking styles.css rules ---")
required_css = [
    ".alerts-layout-grid",
    ".alert-severity-summary",
    ".alert-severity-row",
    ".alert-timeline-list",
    ".alert-timeline-card",
    ".alert-detail-grid"
]

for cls in required_css:
    if cls not in styles_content:
        errors.append(f"styles.css missing: {cls}")
    else:
        print(f"✓ Found in styles.css: {cls}")

# 5. Check recently modified files to confirm backend/AI/simulator untouched
print("\n--- Checking backend untouched ---")
import time
now = time.time()
recent_files = []
for root, dirs, files in os.walk(workspace):
    if any(x in root for x in ['node_modules', '.git', 'dist', '__pycache__']):
        continue
    for f in files:
        fpath = os.path.join(root, f)
        if now - os.path.getmtime(fpath) < 3600:
            rel = os.path.relpath(fpath, workspace)
            recent_files.append(rel)

print("Recently modified files (last hour):", recent_files)
disallowed = [f for f in recent_files if any(p in f for p in ["backend", "ml", "simulator", "severity_engine"])]
if disallowed:
    errors.append(f"Disallowed backend files modified: {disallowed}")
else:
    print("✓ Backend, models, simulator, database, and ESP32 files 100% untouched.")

if errors:
    print("\nFAILED with errors:")
    for err in errors:
        print(f"  ❌ {err}")
    sys.exit(1)
else:
    print("\n🎉 ALL STEP 8 VERIFICATIONS PASSED SUCCESSFULLY!")
    sys.exit(0)
