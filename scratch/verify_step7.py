import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=== STEP 7 VERIFICATION SCRIPT ===")

workspace = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
maint_file = os.path.join(workspace, "dashboard", "src", "pages", "Maintenance.jsx")
assets_file = os.path.join(workspace, "dashboard", "src", "pages", "Assets.jsx")
settings_file = os.path.join(workspace, "dashboard", "src", "pages", "Settings.jsx")
styles_file = os.path.join(workspace, "dashboard", "src", "styles.css")

with open(maint_file, "r", encoding="utf-8") as f:
    maint_content = f.read()

with open(assets_file, "r", encoding="utf-8") as f:
    assets_content = f.read()

with open(settings_file, "r", encoding="utf-8") as f:
    settings_content = f.read()

with open(styles_file, "r", encoding="utf-8") as f:
    styles_content = f.read()

errors = []

# Verify Maintenance.jsx
print("\n--- Checking Maintenance.jsx ---")
required_maint_terms = [
    "PREDICTIVE MAINTENANCE",
    "Maintenance planning based on equipment condition",
    "MAINTENANCE STATUS",
    "NEXT INSPECTION",
    "OPEN TASKS",
    "ASSET HEALTH",
    "EQUIPMENT HEALTH & DEGRADATION",
    "MAINTENANCE TIMELINE",
    "7-STAGE MAINTENANCE WORKFLOW PIPELINE",
    "ACTIVE WORK ORDERS",
    "api.createMaintenance",
    "api.updateMaintenance",
    "handleUpdateStage",
    "handleCreateTask",
    "MOTOR-12V-001",
    "MOTOR-2HP-001"
]

for term in required_maint_terms:
    if term not in maint_content:
        errors.append(f"Maintenance.jsx missing: {term}")
    else:
        print(f"✓ Found in Maintenance.jsx: {term}")

# Verify Assets.jsx
print("\n--- Checking Assets.jsx ---")
required_assets_terms = [
    "ASSET INFRASTRUCTURE",
    "Connected motor assets and monitoring nodes",
    "12 V DC MOTOR",
    "2 HP INDUCTION MOTOR",
    "MOTOR-12V-001",
    "MOTOR-2HP-001",
    "onSelectInfrastructure",
    "active-asset",
    "VOLTAGE",
    "CURRENT",
    "POWER",
    "PWM",
    "RMS VIBRATION",
    "ASSET COMPARISON",
    "onRecordBaseline",
    "onCompare"
]

for term in required_assets_terms:
    if term not in assets_content:
        errors.append(f"Assets.jsx missing: {term}")
    else:
        print(f"✓ Found in Assets.jsx: {term}")

# Verify Settings.jsx
print("\n--- Checking Settings.jsx ---")
required_settings_terms = [
    "SYSTEM SETTINGS",
    "MotorGuard monitoring and system configuration",
    "CONNECTION STATUS",
    "ESP32 HARDWARE NODE",
    "WEBSOCKET TELEMETRY",
    "AI DIAGNOSTIC ENGINE",
    "FASTAPI BACKEND",
    "SQLITE DATABASE",
    "MOTOR PROFILE",
    "SIMULATION CONTROLS",
    "onStartSim",
    "onStopSim",
    "onPauseSim",
    "onResumeSim",
    "onResetSim",
    "onConditionChange",
    "onSpeedChange",
    "AI MODEL ARCHITECTURE SPECIFICATIONS"
]

for term in required_settings_terms:
    if term not in settings_content:
        errors.append(f"Settings.jsx missing: {term}")
    else:
        print(f"✓ Found in Settings.jsx: {term}")

# Verify styles.css
print("\n--- Checking styles.css additions ---")
required_style_classes = [
    ".maint-kpi-grid",
    ".maint-timeline",
    ".maint-task-row",
    ".asset-unit-card",
    ".asset-telemetry-pill-grid",
    ".settings-grid-layout",
    ".connection-status-item"
]

for cls in required_style_classes:
    if cls not in styles_content:
        errors.append(f"styles.css missing: {cls}")
    else:
        print(f"✓ Found in styles.css: {cls}")

# Check git status to ensure ONLY allowed files were touched
import subprocess
git_res = subprocess.run(["git", "status", "--porcelain"], cwd=workspace, capture_output=True, text=True)
print("\n--- Modified Files in Workspace ---")
print(git_res.stdout.strip())

modified_lines = git_res.stdout.strip().split("\n")
disallowed_mods = []
for line in modified_lines:
    if not line.strip():
        continue
    filepath = line.strip().split()[-1]
    # Check if any backend or other page files were touched
    if any(p in filepath for p in ["backend/", "ml/", "Overview.jsx", "LiveMonitoring.jsx", "AIInsights.jsx", "Alerts.jsx", "Analytics.jsx", "Energy.jsx"]):
        disallowed_mods.append(filepath)

if disallowed_mods:
    errors.append(f"Disallowed modifications found: {disallowed_mods}")
else:
    print("✓ Backend, models, and steps 1-6 pages completely untouched.")

if errors:
    print("\nFAILED with errors:")
    for err in errors:
        print(f"  ❌ {err}")
    sys.exit(1)
else:
    print("\n🎉 ALL STEP 7 VERIFICATIONS PASSED SUCCESSFULLY!")
    sys.exit(0)
